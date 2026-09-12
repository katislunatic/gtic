-- A private (non-public) bucket to hold the officials app download. Files
-- here are never directly reachable by URL — the officials-access edge
-- function is the only thing that can hand out a (short-lived, signed) link
-- to them, and only after checking the caller's Discord roles.
INSERT INTO storage.buckets (id, name, public)
VALUES ('officials', 'officials', false)
ON CONFLICT (id) DO NOTHING;

-- Only the service role (used by the edge function) can read/write this
-- bucket's objects — no public or authenticated-user policies at all.
-- That's intentional: it means literally the only way to get the file is
-- through officials-access, which checks Discord roles server-side first.

-- Comma-separated Discord role IDs allowed to access /officials. Edit this
-- value directly in Supabase's Table Editor (site_settings table) whenever
-- you want to add/remove a role — no redeploy needed.
INSERT INTO public.site_settings (key, value)
VALUES ('officials_role_ids', '')
ON CONFLICT (key) DO NOTHING;
