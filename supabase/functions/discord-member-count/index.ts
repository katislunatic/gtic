import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const GUILD_ID = '1385408756464226414'

let cache: { count: number; presence: number; at: number } | null = null
const TTL_MS = 60_000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (cache && Date.now() - cache.at < TTL_MS) {
      return json({ member_count: cache.count, presence_count: cache.presence, cached: true })
    }

    const widgetRes = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/widget.json`)
    if (!widgetRes.ok) throw new Error(`widget ${widgetRes.status}`)
    const widget = await widgetRes.json()
    const invite: string | undefined = widget.instant_invite
    if (!invite) throw new Error('no instant_invite')
    const code = invite.split('/').pop()

    const invRes = await fetch(`https://discord.com/api/v10/invites/${code}?with_counts=true`)
    if (!invRes.ok) throw new Error(`invite ${invRes.status}`)
    const inv = await invRes.json()
    const member_count = inv.approximate_member_count ?? inv.profile?.member_count ?? 0
    const presence_count = inv.approximate_presence_count ?? widget.presence_count ?? 0

    cache = { count: member_count, presence: presence_count, at: Date.now() }
    return json({ member_count, presence_count, cached: false })
  } catch (e) {
    return json({ error: String(e), member_count: null }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}