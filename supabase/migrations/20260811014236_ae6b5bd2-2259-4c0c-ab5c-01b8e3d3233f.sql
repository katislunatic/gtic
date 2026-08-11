CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update settings" ON public.site_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete settings" ON public.site_settings FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (key, value) VALUES
  ('teams_count', '26'),
  ('season', '4'),
  ('stage_label', 'Elimination'),
  ('stage_value', 'Round 2'),
  ('bracket_path', ''),
  ('bracket_title', 'Season 4 Bracket');

CREATE POLICY "Anyone can read site assets" ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');
CREATE POLICY "Admins upload site assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update site assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete site assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'));