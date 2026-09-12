DROP INDEX IF EXISTS public.staff_members_discord_user_id_key;
CREATE UNIQUE INDEX staff_members_discord_user_id_key ON public.staff_members USING btree (discord_user_id);