import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Given a Discord user ID, returns their current username, display name,
// and avatar URL — used by the Voting admin panel so pasting an ID
// auto-fills a name/photo instead of typing them in by hand. Reuses the
// same DISCORD_BOT_TOKEN secret as discord-staff-sync.
const cdn = (path: string, hash: string) =>
  `https://cdn.discordapp.com/${path}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=256`

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

    const { discord_user_id } = await req.json().catch(() => ({}))
    if (!discord_user_id || typeof discord_user_id !== 'string') {
      return json({ error: 'discord_user_id is required.' }, 400)
    }

    const res = await fetch(`https://discord.com/api/v10/users/${discord_user_id}`, {
      headers: { Authorization: `Bot ${token}` },
    })

    if (res.status === 404) return json({ error: 'No Discord account found with that ID.' }, 404)
    if (!res.ok) return json({ error: `Discord API error (${res.status})` }, 502)

    const user = await res.json()
    const avatar_url = user.avatar
      ? cdn(`avatars/${user.id}`, user.avatar)
      : `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(user.id) >> 22n) % 6}.png`

    return json({
      discord_user_id: user.id,
      username: user.username,
      display_name: user.global_name ?? user.username,
      avatar_url,
    })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
  }
})
