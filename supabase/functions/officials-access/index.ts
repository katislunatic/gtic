import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Checks that the logged-in caller's Discord account has one of the
// configured roles in your server, and if so, hands back a short-lived
// signed URL to whatever file is sitting in the private "officials"
// storage bucket. Nothing here is ever guessable/reachable by URL on its
// own — every request re-checks the role server-side against the caller's
// verified Supabase session, not anything the client claims about itself.
const BUCKET = 'officials'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace(/^Bearer\s+/i, '')
    if (!jwt) return json({ error: 'Not logged in.' }, 401)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    )

    // Verifies the JWT against Supabase itself — this is the caller's real,
    // signed identity, not anything the request body could fake.
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt)
    if (userErr || !userData?.user) return json({ error: 'Not logged in.' }, 401)

    const discordUserId = (userData.user.user_metadata as Record<string, unknown> | null)?.discord_user_id as
      | string
      | undefined
    if (!discordUserId) return json({ error: 'No Discord account linked to this session.' }, 403)

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN')
    if (!botToken) return json({ error: 'Discord bot token is not configured.' }, 500)

    const { data: settings } = await admin
      .from('site_settings')
      .select('key,value')
      .in('key', ['discord_guild_id', 'officials_role_ids'])
    const map = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]))
    const guildId = map['discord_guild_id']
    const allowedRoleIds = (map['officials_role_ids'] ?? '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)

    if (!guildId) return json({ error: 'Discord server ID is not set.' }, 400)
    if (allowedRoleIds.length === 0) return json({ error: 'No roles have been configured for officials access.' }, 403)

    const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    })

    // Not a member of the server at all → same denial as "wrong role".
    if (memberRes.status === 404) return json({ error: 'not_authorized' }, 403)
    if (!memberRes.ok) return json({ error: `Discord API error (${memberRes.status})` }, 502)

    const member = await memberRes.json()
    const memberRoles: string[] = member.roles ?? []
    const hasAccess = memberRoles.some((r) => allowedRoleIds.includes(r))
    if (!hasAccess) return json({ error: 'not_authorized' }, 403)

    // Grab whatever file is sitting in the bucket — this is the part that
    // lets you swap the file in Supabase Storage without touching any code.
    const { data: files, error: listErr } = await admin.storage.from(BUCKET).list('', {
      limit: 1,
      sortBy: { column: 'created_at', order: 'desc' },
    })
    if (listErr || !files || files.length === 0) {
      return json({ error: 'No file has been uploaded to the officials bucket yet.' }, 404)
    }

    const file = files[0]

    // Stream the bytes back directly in this same authenticated response
    // instead of handing out a separate signed URL — there's no link that
    // could ever be copy-pasted or reused later, because nothing exists
    // outside of this one already-authorized request.
    const { data: signed, error: signErr } = await admin.storage.from(BUCKET).createSignedUrl(file.name, 30)
    if (signErr || !signed) return json({ error: 'Could not read the file.' }, 500)

    const fileRes = await fetch(signed.signedUrl)
    if (!fileRes.ok || !fileRes.body) return json({ error: 'Could not read the file.' }, 500)

    return new Response(fileRes.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': fileRes.headers.get('Content-Type') ?? 'application/octet-stream',
        'Content-Length': fileRes.headers.get('Content-Length') ?? '',
        'Content-Disposition': `attachment; filename="${file.name}"`,
      },
    })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
  }
})
