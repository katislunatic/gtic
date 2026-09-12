import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

// The one Discord account that is allowed to add/remove other admins.
const OWNER_DISCORD_ID = '1252981295454224390'
const DISCORD_API = 'https://discord.com/api/v10'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const admin = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

// Resolves the Discord id of the caller from their Supabase session.
const callerDiscordId = async (req: Request): Promise<string | null> => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null
  const { data } = await admin().auth.getUser(authHeader.replace('Bearer ', ''))
  return (data?.user?.user_metadata?.discord_user_id as string) ?? null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const clientId = Deno.env.get('DISCORD_CLIENT_ID')
    const clientSecret = Deno.env.get('DISCORD_CLIENT_SECRET')
    const body = await req.json().catch(() => ({}))
    const action = String(body.action ?? '')
    const db = admin()

    if (action === 'login-url') {
      if (!clientId) return json({ error: 'Discord login is not configured yet.' }, 500)
      const redirectUri = String(body.redirect_uri ?? '')
      const url =
        `https://discord.com/oauth2/authorize?client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`
      return json({ url })
    }

    if (action === 'exchange') {
      if (!clientId || !clientSecret) return json({ error: 'Discord login is not configured yet.' }, 500)
      const code = String(body.code ?? '')
      const redirectUri = String(body.redirect_uri ?? '')
      if (!code) return json({ error: 'Missing code' }, 400)

      const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      })
      if (!tokenRes.ok) return json({ error: `Discord token exchange failed: ${await tokenRes.text()}` }, 400)
      const token = await tokenRes.json()

      const meRes = await fetch(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bearer ${token.access_token}` },
      })
      if (!meRes.ok) return json({ error: `Discord profile fetch failed: ${await meRes.text()}` }, 400)
      const me = await meRes.json()

      const profile = {
        discord_user_id: me.id as string,
        username: me.username as string,
        display_name: (me.global_name ?? me.username) as string,
        avatar_url: me.avatar
          ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.${String(me.avatar).startsWith('a_') ? 'gif' : 'png'}?size=128`
          : `https://cdn.discordapp.com/embed/avatars/0.png`,
      }

      const { data: adminRow } = await db
        .from('admin_discord_users')
        .select('discord_user_id')
        .eq('discord_user_id', me.id)
        .maybeSingle()
      const isAdmin = !!adminRow

      // Mint (or reuse) a Supabase user keyed to this Discord account, then
      // hand the browser a one-time token it can trade for a real session.
      const email = `discord_${me.id}@gtec.local`
      const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
      let user = list?.users?.find((u) => u.email === email) ?? null

      if (!user) {
        const { data: created, error: createErr } = await db.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: profile,
        })
        if (createErr) return json({ error: createErr.message }, 500)
        user = created.user
      } else {
        await db.auth.admin.updateUserById(user.id, { user_metadata: profile })
      }

      // Keep the app's role table in sync with the Discord allow-list.
      if (isAdmin) {
        const { data: existingRole } = await db
          .from('user_roles')
          .select('id')
          .eq('user_id', user!.id)
          .eq('role', 'admin')
          .maybeSingle()
        if (!existingRole) await db.from('user_roles').insert({ user_id: user!.id, role: 'admin' })
      } else {
        await db.from('user_roles').delete().eq('user_id', user!.id).eq('role', 'admin')
      }

      const { data: link, error: linkErr } = await db.auth.admin.generateLink({ type: 'magiclink', email })
      if (linkErr) return json({ error: linkErr.message }, 500)

      return json({
        profile,
        is_admin: isAdmin,
        is_owner: me.id === OWNER_DISCORD_ID,
        email,
        token_hash: link.properties?.hashed_token,
      })
    }

    if (action === 'list-admins') {
      const caller = await callerDiscordId(req)
      if (!caller) return json({ error: 'Not signed in' }, 401)
      const { data: allowed } = await db
        .from('admin_discord_users')
        .select('discord_user_id')
        .eq('discord_user_id', caller)
        .maybeSingle()
      if (!allowed) return json({ error: 'Not authorized' }, 403)
      const { data } = await db.from('admin_discord_users').select('*').order('created_at')
      return json({ admins: data ?? [], is_owner: caller === OWNER_DISCORD_ID })
    }

    if (action === 'add-admin' || action === 'remove-admin') {
      const caller = await callerDiscordId(req)
      if (caller !== OWNER_DISCORD_ID) return json({ error: 'Only the owner can manage admins.' }, 403)
      const targetId = String(body.discord_user_id ?? '').trim()
      if (!/^\d{5,25}$/.test(targetId)) return json({ error: 'Enter a valid Discord user ID.' }, 400)

      if (action === 'add-admin') {
        let username: string | null = null
        const botToken = Deno.env.get('DISCORD_BOT_TOKEN')
        if (botToken) {
          const r = await fetch(`${DISCORD_API}/users/${targetId}`, {
            headers: { Authorization: `Bot ${botToken}` },
          })
          if (r.ok) {
            const u = await r.json()
            username = u.global_name ?? u.username ?? null
          }
        }
        const { error } = await db
          .from('admin_discord_users')
          .upsert({ discord_user_id: targetId, username, added_by: caller }, { onConflict: 'discord_user_id' })
        if (error) return json({ error: error.message }, 500)
      } else {
        if (targetId === OWNER_DISCORD_ID) return json({ error: 'The owner cannot be removed.' }, 400)
        await db.from('admin_discord_users').delete().eq('discord_user_id', targetId)
        // Also strip the admin role from their existing account, if any.
        const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
        const target = list?.users?.find((u) => u.email === `discord_${targetId}@gtec.local`)
        if (target) await db.from('user_roles').delete().eq('user_id', target.id).eq('role', 'admin')
      }

      const { data } = await db.from('admin_discord_users').select('*').order('created_at')
      return json({ admins: data ?? [] })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
