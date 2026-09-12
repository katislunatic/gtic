DELETE FROM public.staff_members a USING public.staff_members b
WHERE a.discord_user_id IS NOT NULL AND a.discord_user_id = b.discord_user_id AND a.ctid > b.ctid;
CREATE UNIQUE INDEX IF NOT EXISTS staff_members_discord_user_id_key
ON public.staff_members (discord_user_id) WHERE discord_user_id IS NOT NULL;