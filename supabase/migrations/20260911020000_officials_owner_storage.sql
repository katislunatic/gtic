-- Lets the site owner manage the officials bucket directly from the site
-- (upload/replace/delete the file) without needing service-role access.
-- Locked to one specific Discord account via the discord_user_id embedded
-- in their session's user_metadata — not the general "admin" role, since
-- this is meant to stay owner-only even if other accounts are ever made
-- admins later.
CREATE POLICY "Owner can manage officials bucket"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'officials'
    AND (auth.jwt() -> 'user_metadata' ->> 'discord_user_id') = '1252981295454224390'
  )
  WITH CHECK (
    bucket_id = 'officials'
    AND (auth.jwt() -> 'user_metadata' ->> 'discord_user_id') = '1252981295454224390'
-- And the same lock for the officials_role_ids setting itself, in case the
-- owner's account doesn't have the general "admin" DB role assigned (the
-- existing site_settings policies already allow admins to update it, but
-- this guarantees it works for the owner specifically either way).
CREATE POLICY "Owner can update officials role ids"
  ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (
    key = 'officials_role_ids'
    AND (auth.jwt() -> 'user_metadata' ->> 'discord_user_id') = '1252981295454224390'
  );
