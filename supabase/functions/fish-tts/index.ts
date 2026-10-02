import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Text-to-speech proxy for the "pronounce name" button on player profiles,
// using Fish Audio instead of the browser's built-in (robotic) TTS for a
// much more natural/human voice. The API key (and which voice to use) never
// reach the browser -- this function holds them server-side, same pattern
// as ai-chat and ai-image.
//
// Required Supabase secrets:
//   FISH_API_KEY   - from fish.audio/app/api-keys
// Optional:
//   FISH_VOICE_ID  - a specific voice's reference_id from the Fish Audio
//                    voice library (https://fish.audio -- browse, pick a
//                    voice, copy its id). If unset, Fish's default voice
//                    for the model is used instead.
//   FISH_TTS_MODEL - defaults to "s2.1-pro-free" (Fish's free tier model)
//                    so this doesn't rack up a bill until a paid model is
//                    deliberately chosen.

const FISH_API_KEY = Deno.env.get('FISH_API_KEY')
const FISH_VOICE_ID = Deno.env.get('FISH_VOICE_ID')
const FISH_TTS_MODEL = Deno.env.get('FISH_TTS_MODEL') || 's2.1-pro-free'

// Small per-IP rate limiter, same shape as ai-chat's -- this hits a paid-
// capable API, so it's worth protecting even though the default model is
// free-tier.
const hits = new Map<string, number[]>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 10

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
    if (!FISH_API_KEY) {
      return json({ error: 'Text-to-speech is not configured on the server yet.' }, 500)
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

    const { text } = await req.json()
    if (!text || typeof text !== 'string') {
      return json({ error: 'text is required' }, 400)
    }
    // Names are short; this is a hard cap against someone passing something
    // much longer than a display name through this endpoint.
    const trimmedText = text.slice(0, 100)

    // Fish's generation is random per call, so the same name sounds
    // different each time. Cache the first result per (voice, model, text)
    // in a private storage bucket and replay it forever after, so every
    // player's name always sounds identical.
    // Bump the version prefix whenever voice settings change so old clips regenerate.
    const cacheKey = await sha256(`v2|${FISH_VOICE_ID ?? 'default'}|${FISH_TTS_MODEL}|${trimmedText}`)
    const cachePath = `${cacheKey}.mp3`
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const cached = await admin.storage.from('tts-cache').download(cachePath)
    if (cached.data) {
      return new Response(cached.data, {
        headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' },
      })
    }

    if (rateLimited(ip)) {
      return json({ error: 'Too many requests — wait a moment and try again.' }, 429)
    }

    const fishRes = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FISH_API_KEY}`,
        'Content-Type': 'application/json',
        model: FISH_TTS_MODEL,
      },
      body: JSON.stringify({
        text: trimmedText,
        ...(FISH_VOICE_ID ? { reference_id: FISH_VOICE_ID } : {}),
        format: 'mp3',
        latency: 'normal',
        normalize: true,
        sample_rate: 44100,
        mp3_bitrate: 192,
        temperature: 0.3,
        top_p: 0.5,
      }),
    })

    if (!fishRes.ok) {
      const errText = await fishRes.text()
      console.error('Fish Audio TTS failed:', fishRes.status, errText)
      return json({ error: 'Text-to-speech failed.' }, 502)
    }

    const audio = new Uint8Array(await fishRes.arrayBuffer())
    const up = await admin.storage
      .from('tts-cache')
      .upload(cachePath, audio, { contentType: 'audio/mpeg', upsert: true })
    if (up.error) console.error('TTS cache upload failed:', up.error.message)

    return new Response(audio, {
      headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' },
    })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
