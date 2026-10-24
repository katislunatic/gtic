import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Receives an appeal from the website, works out who the visitor really is
// from their Supabase session, and forwards it to the mod bot's appeal API on
// the Pi (over Tailscale Funnel) with a shared secret that never reaches the
// browser.
//
// Secrets (Supabase -> Edge Functions -> Secrets):
//   APPEAL_API_URL     e.g. https://gtecofficials.tailde4962.ts.net:10000
//   APPEAL_API_SECRET  same value as APPEAL_API_SECRET in the mod bot's .env
//   DISCORD_BOT_TOKEN  already set (used to look up the real username/avatar)

const DISCORD_API = 'https://discord.com/api/v10'
const MAX_FILES = 5
const MAX_FILE_BYTES = 8 * 1024 * 1024
const MAX_TOTAL_BYTES = 30 * 1024 * 1024

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const admin = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

// The Discord id comes from the account's email (discord_<id>@gtec.local),
// which was set server-side by discord-auth. user_metadata is NOT used for
// this: signed-in users can edit their own user_metadata from the browser.
const discordIdFromSession = async (req: Request): Promise<string | null> => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null
  const { data } = await admin().auth.getUser(authHeader.replace('Bearer ', ''))
  const email = data?.user?.email ?? ''
  const match = /^discord_(\d{5,25})@gtec\.local$/.exec(email)
  return match ? match[1] : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const apiUrl = Deno.env.get('APPEAL_API_URL')
    const apiSecret = Deno.env.get('APPEAL_API_SECRET')
    if (!apiUrl || !apiSecret) return json({ error: 'Appeals are not configured yet.' }, 500)

    const discordUserId = await discordIdFromSession(req)
    if (!discordUserId) return json({ error: 'You must be logged in with Discord to submit an appeal.' }, 401)

    const incoming = await req.formData()
    const files = incoming.getAll('evidence').filter((f): f is File => f instanceof File && f.size > 0)

    if (files.length > MAX_FILES) return json({ error: `You can attach up to ${MAX_FILES} files.` }, 400)
    if (files.some((f) => f.size > MAX_FILE_BYTES)) {
      return json({ error: `Each file must be under ${MAX_FILE_BYTES / 1024 / 1024}MB.` }, 400)
    }
    if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES) {
      return json({ error: 'Your files are too large in total. Try fewer or smaller files.' }, 413)
    }

    // Look up the real username/avatar from Discord so staff see trustworthy info.
    let username = 'unknown'
    let avatar = ''
    const botToken = Deno.env.get('DISCORD_BOT_TOKEN')
    if (botToken) {
      const r = await fetch(`${DISCORD_API}/users/${discordUserId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      })
      if (r.ok) {
        const u = await r.json()
        username = u.username ?? username
        avatar = u.avatar ?? ''
      }
    }

    const out = new FormData()
    out.append('discordUserId', discordUserId)
    out.append('username', username)
    out.append('avatar', avatar)
    for (const key of ['punishmentId', 'statement', 'promise', 'extra']) {
      out.append(key, String(incoming.get(key) ?? ''))
    }
    for (const f of files) out.append('evidence', f, f.name)

    let upstream: Response
    try {
      upstream = await fetch(`${apiUrl.replace(/\/$/, '')}/appeal/submit`, {
        method: 'POST',
        headers: { 'x-appeal-secret': apiSecret },
        body: out,
      })
    } catch (_e) {
      return json({ error: 'The appeal system is offline right now. Please try again later, or use /appeal in Discord.' }, 502)
    }

    const payload = await upstream.json().catch(() => ({ error: 'Unexpected response from the appeal system.' }))
    return json(payload, upstream.status)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
