-- Create official_teams table
CREATE TABLE IF NOT EXISTS public.official_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.official_teams ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view teams
CREATE POLICY "Anyone can view official teams"
ON public.official_teams
FOR SELECT
USING (true);

-- Only admins can insert teams
CREATE POLICY "Admins can insert official teams"
ON public.official_teams
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update teams
CREATE POLICY "Admins can update official teams"
ON public.official_teams
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete teams
CREATE POLICY "Admins can delete official teams"
ON public.official_teams
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger for official_teams
CREATE TRIGGER update_official_teams_updated_at
BEFORE UPDATE ON public.official_teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();