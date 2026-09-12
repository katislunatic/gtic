-- Lets a voting option be linked to a real Discord account: paste a user ID
-- and the admin UI fetches their current display name + avatar via the
-- discord-user-lookup edge function. display_name_override lets an admin
-- show a different name than what's currently on Discord without touching
-- the link. Both stay nullable — options can still be plain manual entries
-- (a label + optional image) with no Discord account attached at all.
ALTER TABLE public.voting_options
  ADD COLUMN discord_user_id TEXT,
  ADD COLUMN display_name_override TEXT;
