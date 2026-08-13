import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const DISCORD_API = 'https://discord.com/api/v10'
const THROTTLE_MS = 5 * 60 * 1000

type Category = { id: string; name: string; sort_order: number; discord_role_id: string | null }

const cdn = (path: string, hash: string) =>
  `https://cdn.discordapp.com/${path}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=512`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const token = Deno.env.get('DISCORD_BOT_TOKEN')
    if (!token) return json({ error: 'Discord bot token is not configured.' }, 500)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    )

    const force = new URL(req.url).searchParams.get('force') === '1'

    const { data: settings } = await admin
      .from('site_settings')
      .select('key,value')
      .in('key', ['discord_guild_id', 'staff_last_sync'])
    const map = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]))
    const guildId = map['discord_guild_id']
    if (!guildId) return json({ error: 'Discord server ID is not set.' }, 400)

    const last = Date.parse(map['staff_last_sync'] ?? '')
    if (!force && Number.isFinite(last) && Date.now() - last < THROTTLE_MS) {
      return json({ skipped: true, reason: 'throttled', last_synced_at: map['staff_last_sync'] })
    }

    const { data: cats } = await admin
      .from('staff_categories')
      .select('id,name,sort_order,discord_role_id')
      .not('discord_role_id', 'is', null)
      .order('sort_order')
      .order('created_at')

    const categories = (cats ?? []) as Category[]
    if (categories.length === 0) return json({ synced: 0, note: 'No roles are linked to a Discord role yet.' })

    // Fetch all guild members (requires the SERVER MEMBERS privileged intent).
    const members: any[] = []
    let after = '0'
    for (let page = 0; page < 20; page++) {
      const res = await fetch(`${DISCORD_API}/guilds/${guildId}/members?limit=1000&after=${after}`, {
        headers: { Authorization: `Bot ${token}` },
      })
      if (!res.ok) {
        const text = await res.text()
        return json({ error: `Discord API error (${res.status}). Make sure the bot is in the server and the SERVER MEMBERS INTENT is enabled.`, detail: text }, 502)
      }
      const batch = await res.json()
      members.push(...batch)
      if (batch.length < 1000) break
      after = batch[batch.length - 1].user.id
    }

    // Assign each member to their highest-priority linked role (first match wins).
    const assignments = new Map<string, { category: Category; member: any }>()
    for (const category of categories) {
      for (const m of members) {
        const roles: string[] = m.roles ?? []
        if (!roles.includes(category.discord_role_id!)) continue
        if (assignments.has(m.user.id)) continue
        assignments.set(m.user.id, { category, member: m })
      }
    }

    const rows: any[] = []
    let order = 0
    for (const { category, member: m } of assignments.values()) {
      const user = m.user
      let banner: string | null = null
      const profile = await fetch(`${DISCORD_API}/users/${user.id}`, {
        headers: { Authorization: `Bot ${token}` },
      })
      if (profile.ok) {
        const u = await profile.json()
        if (u.banner) banner = cdn(`banners/${user.id}`, u.banner)
      }

      const avatar = m.avatar
        ? cdn(`guilds/${guildId}/users/${user.id}/avatars`, m.avatar)
        : user.avatar
        ? cdn(`avatars/${user.id}`, user.avatar)
        : null

      rows.push({
        category_id: category.id,
        discord_user_id: user.id,
        username: user.username,
        display_name: m.nick || user.global_name || user.username,
        avatar_url: avatar,
        banner_url: banner,
        is_synced: true,
        last_synced_at: new Date().toISOString(),
        sort_order: order++,
      })
    }

    if (rows.length > 0) {
      const { error } = await admin
        .from('staff_members')
        .upsert(rows, { onConflict: 'discord_user_id' })
      if (error) return json({ error: error.message }, 500)
    }

    // Remove synced members who no longer hold any linked role
    const keep = rows.map((r) => r.discord_user_id)
    const stale = admin.from('staff_members').delete().eq('is_synced', true)
    if (keep.length > 0) await stale.not('discord_user_id', 'in', `(${keep.join(',')})`)
    else await stale

    await admin
      .from('site_settings')
      .upsert({ key: 'staff_last_sync', value: new Date().toISOString() }, { onConflict: 'key' })

    return json({ synced: rows.length, roles: categories.length })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
  }
})
