
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  session_id text NOT NULL,
  referrer text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read page views" ON public.page_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON public.page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_path_idx ON public.page_views (path);

CREATE OR REPLACE FUNCTION public.track_page_view(_path text, _session_id text, _referrer text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  IF _path IS NULL OR length(_path) > 300 OR _session_id IS NULL OR length(_session_id) > 100 THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.page_views (path, session_id, referrer)
  VALUES (_path, _session_id, left(coalesce(_referrer, ''), 300))
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.track_page_view(text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.track_page_duration(_id uuid, _ms integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.page_views
     SET duration_ms = greatest(0, least(_ms, 3600000))
   WHERE id = _id AND created_at > now() - interval '1 day';
$$;
GRANT EXECUTE ON FUNCTION public.track_page_duration(uuid, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_page_view_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM page_views),
    'today', (SELECT count(*) FROM page_views WHERE created_at > now() - interval '1 day'),
    'week', (SELECT count(*) FROM page_views WHERE created_at > now() - interval '7 days'),
    'month', (SELECT count(*) FROM page_views WHERE created_at > now() - interval '30 days'),
    'year', (SELECT count(*) FROM page_views WHERE created_at > now() - interval '365 days'),
    'unique_sessions_today', (SELECT count(DISTINCT session_id) FROM page_views WHERE created_at > now() - interval '1 day'),
    'unique_sessions_week', (SELECT count(DISTINCT session_id) FROM page_views WHERE created_at > now() - interval '7 days'),
    'unique_sessions_month', (SELECT count(DISTINCT session_id) FROM page_views WHERE created_at > now() - interval '30 days'),
    'unique_sessions_total', (SELECT count(DISTINCT session_id) FROM page_views),
    'avg_duration_ms', (SELECT coalesce(round(avg(duration_ms)), 0) FROM page_views WHERE duration_ms IS NOT NULL AND created_at > now() - interval '30 days'),
    'top_pages', (
      SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM (
        SELECT path,
               count(*) AS views,
               count(DISTINCT session_id) AS visitors,
               coalesce(round(avg(duration_ms)), 0) AS avg_duration_ms
          FROM page_views
         WHERE created_at > now() - interval '30 days'
         GROUP BY path
         ORDER BY count(*) DESC
         LIMIT 10
      ) t
    ),
    'daily', (
      SELECT coalesce(jsonb_agg(d ORDER BY d.day), '[]'::jsonb) FROM (
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
               count(*) AS views,
               count(DISTINCT session_id) AS visitors
          FROM page_views
         WHERE created_at > now() - interval '14 days'
         GROUP BY 1
      ) d
    ),
    'referrers', (
      SELECT coalesce(jsonb_agg(r), '[]'::jsonb) FROM (
        SELECT coalesce(nullif(referrer, ''), 'direct') AS source, count(*) AS views
          FROM page_views
         WHERE created_at > now() - interval '30 days'
         GROUP BY 1 ORDER BY count(*) DESC LIMIT 5
      ) r
    )
  ) INTO result;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_page_view_stats() TO authenticated;

CREATE TABLE IF NOT EXISTS public.admin_discord_users (
  discord_user_id text PRIMARY KEY,
  username text,
  added_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_discord_users TO authenticated;
GRANT ALL ON public.admin_discord_users TO service_role;
ALTER TABLE public.admin_discord_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read admin discord users" ON public.admin_discord_users FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.admin_discord_users (discord_user_id, username, added_by)
VALUES ('1252981295454224390', 'owner', 'system')
ON CONFLICT (discord_user_id) DO NOTHING;
