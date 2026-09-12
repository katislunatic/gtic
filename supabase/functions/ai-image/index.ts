import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Free-tier AI image generation proxy for the GTIC site.
// Primary: Pollinations.ai (no API key required at all, unlimited-ish free use).
// Fallback: Gemini image generation (free tier) if Pollinations is down.
//
// Required Supabase secret (optional, only needed for the fallback):
//   GEMINI_API_KEY - from aistudio.google.com/apikey

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_IMAGE_MODEL = 'gemini-2.0-flash-preview-image-generation'

const hits = new Map<string, number[]>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 4 // images are heavier, keep this tighter than chat

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  arr.push(now)
  hits.set(ip, arr)
  return arr.length > MAX_PER_WINDOW
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (rateLimited(ip)) {
      return json({ error: 'Too many images requested — wait a moment and try again.' }, 429)
    }

    const { prompt } = await req.json()
    if (!prompt || typeof prompt !== 'string') {
      return json({ error: 'prompt string required' }, 400)
    }
    const safePrompt = prompt.slice(0, 500)

    try {
      const url = await callPollinations(safePrompt)
      return json({ image_url: url, provider: 'pollinations' })
    } catch (e) {
      console.error('Pollinations failed, falling back to Gemini:', e)
    }

    if (GEMINI_API_KEY) {
      const dataUrl = await callGeminiImage(safePrompt)
      return json({ image_url: dataUrl, provider: 'gemini' })
    }

    return json({ error: 'Image generation is temporarily unavailable.' }, 500)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

// Pollinations serves the generated image directly at a GET URL — no key,
// no request body. We just build the URL; the browser loads it as an <img>.
async function callPollinations(prompt: string): Promise<string> {
  const seed = Math.floor(Math.random() * 1_000_000)
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&seed=${seed}&nologo=true`
  // Verify it actually resolves before handing it back, so a Pollinations
  // outage falls through to Gemini instead of showing a broken image.
  const check = await fetch(url, { method: 'HEAD' })
  if (!check.ok) throw new Error(`Pollinations ${check.status}`)
  return url
}

async function callGeminiImage(prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    },
  )
  if (!res.ok) throw new Error(`Gemini image ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const part = data.candidates?.[0]?.content?.parts?.find((p: { inlineData?: unknown }) => p.inlineData)
  const inline = part?.inlineData
  if (!inline?.data) throw new Error('Gemini returned no image data')
  return `data:${inline.mimeType ?? 'image/png'};base64,${inline.data}`
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
