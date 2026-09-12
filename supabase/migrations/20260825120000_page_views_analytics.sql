-- Anonymous page-view tracking, gated client-side by cookie consent (see
-- src/lib/analytics.ts) — no personal data, just a path, a timestamp, and a
-- randomly generated session id stored in the visitor's browser so repeat
-- views can be told apart from unique sessions.
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL,
  session_id TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_views_viewed_at ON public.page_views (viewed_at);
CREATE INDEX idx_page_views_path ON public.page_views (path);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Same open-policy pattern used across this project's other tables (admin
-- gating happens client-side via the isAdmin flag, not at the RLS level) —
-- anyone can insert a page view (that's how tracking works for visitors who
-- aren't logged in at all), and reads are open too since nothing sensitive
-- is stored here (no IP, no user id, just path + a random session token).
CREATE POLICY "Page views can be inserted by anyone"
ON public.page_views
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Page views are viewable by everyone"
ON public.page_views
FOR SELECT
USING (true);

-- Aggregates total views, views in the last 24 hours, unique sessions in the
-- last 24 hours, and the top 5 most-viewed paths — called once from the
-- Admin Panel's Site Stats section rather than pulling every raw row.
CREATE OR REPLACE FUNCTION public.get_page_view_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', (SELECT count(*) FROM public.page_views),
    'today', (SELECT count(*) FROM public.page_views WHERE viewed_at >= now() - interval '24 hours'),
    'unique_sessions_today', (
      SELECT count(DISTINCT session_id) FROM public.page_views WHERE viewed_at >= now() - interval '24 hours'
    ),
    'top_pages', (
      SELECT COALESCE(json_agg(t), '[]'::json) FROM (
        SELECT path, count(*) AS views
        FROM public.page_views
        GROUP BY path
        ORDER BY views DESC
        LIMIT 5
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;
