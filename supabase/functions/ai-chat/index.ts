import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Free-tier AI chat proxy for the GTIC site.
// Primary: Groq (fast, generous free tier, open models like Llama 3.1).
// Fallback: Gemini (Google's free tier) if Groq fails or key is missing.
//
// Required Supabase secrets:
//   GROQ_API_KEY   - from console.groq.com
//   GEMINI_API_KEY - from aistudio.google.com/apikey

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GEMINI_MODEL = 'gemini-2.0-flash'

const SYSTEM_PROMPT =
  'You are the GTIC site assistant, a helpful chat bot for the Gorilla Tag Intermediate COMP ' +
  'community (a Gorilla Tag esports/competitive Discord community). Be friendly, concise, and ' +
  'helpful. If asked about specific league rules, schedules, or account issues you are unsure ' +
  'about, suggest the user check the site or ask staff in the Discord. Keep replies short ' +
  '(a few sentences) unless the user asks for detail.'

// Very small in-memory rate limiter per IP to protect the free-tier quota
// from being burned by a handful of users. Resets on cold start, which is
// fine for this purpose (it's a courtesy limit, not a security boundary).
const hits = new Map<string, number[]>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 8

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
      return json({ error: 'Too many messages — wait a moment and try again.' }, 429)
    }

    const { messages } = await req.json()
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'messages array required' }, 400)
    }

    // Cap history sent upstream to keep free-tier token usage low.
    const trimmed = messages.slice(-12)

    if (GROQ_API_KEY) {
      try {
        const reply = await callGroq(trimmed)
        return json({ reply, provider: 'groq' })
      } catch (e) {
        console.error('Groq failed, falling back to Gemini:', e)
      }
    }

    if (GEMINI_API_KEY) {
      const reply = await callGemini(trimmed)
      return json({ reply, provider: 'gemini' })
    }

    return json({ error: 'No AI provider configured on the server.' }, 500)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

async function callGroq(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 500,
      temperature: 0.7,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const reply = data.choices?.[0]?.message?.content
  if (!reply) throw new Error('Groq returned no content')
  return reply
}

async function callGemini(messages: { role: string; content: string }[]): Promise<string> {
  // Gemini uses "user"/"model" roles and a separate system_instruction field.
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
      }),
    },
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!reply) throw new Error('Gemini returned no content')
  return reply
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
