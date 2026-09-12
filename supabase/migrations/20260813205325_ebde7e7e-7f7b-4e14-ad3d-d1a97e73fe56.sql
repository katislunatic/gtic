ALTER TABLE public.staff_categories ADD COLUMN IF NOT EXISTS discord_role_id text;

ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS is_synced boolean NOT NULL DEFAULT false;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS staff_members_discord_user_id_key
  ON public.staff_members (discord_user_id)
  WHERE discord_user_id IS NOT NULL;

INSERT INTO public.site_settings (key, value)
VALUES ('discord_guild_id', '1385408756464226414')
ON CONFLICT (key) DO NOTHING;