import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// No API key needed — YouTube's public "/live" redirect page tells us
// whether a channel is currently streaming and, if so, which video.
const LIVE_URLS = [
  'https://www.youtube.com/channel/UCq7aUAUOetgR9GwTp7v-mOQ/live',
  'https://www.youtube.com/@GTECLeague/live',
]

let cache: { live: boolean; videoId: string | null; title: string | null; thumbnail: string | null; at: number } | null = null
const TTL_MS = 60_000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (cache && Date.now() - cache.at < TTL_MS) {
      return json({ ...stripCache(cache), cached: true })
    }

    let live = false
    let videoId: string | null = null
    let title: string | null = null

    for (const url of LIVE_URLS) {
      const res = await fetch(url, {
        headers: {
          // A normal browser UA avoids YouTube serving a stripped-down page.
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })
      if (!res.ok) continue
      const html = await res.text()

      const isLive = html.includes('"isLiveNow":true') || html.includes('"isLive":true')
      const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/)
      const id = canonicalMatch ? canonicalMatch[1] : null

      if (isLive && id) {
        live = true
        videoId = id
        const titleMatch = html.match(/<meta name="title" content="([^"]*)"/)
        if (titleMatch) title = decodeHtmlEntities(titleMatch[1])
        break
      }
    }

    const thumbnail = live && videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : null

    cache = { live, videoId: live ? videoId : null, title: live ? title : null, thumbnail, at: Date.now() }
    return json({ ...stripCache(cache), cached: false })
  } catch (e) {
    return json({ error: String(e), live: false, videoId: null, title: null, thumbnail: null }, 200)
  }
})

function stripCache(c: NonNullable<typeof cache>) {
  const { at, ...rest } = c
  return rest
}

function decodeHtmlEntities(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
