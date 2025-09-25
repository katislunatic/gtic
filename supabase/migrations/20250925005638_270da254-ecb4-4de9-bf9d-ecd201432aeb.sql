-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  captain TEXT NOT NULL,
  members TEXT[] NOT NULL DEFAULT '{}',
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  region TEXT NOT NULL,
  logo TEXT,
  founded DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL UNIQUE,
  team1 TEXT NOT NULL,
  team2 TEXT NOT NULL,
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  round TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  winner TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create champions table
CREATE TABLE public.champions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season TEXT NOT NULL,
  team_name TEXT NOT NULL,
  captain TEXT NOT NULL,
  members TEXT[] NOT NULL DEFAULT '{}',
  final_score TEXT NOT NULL,
  mvp_name TEXT NOT NULL,
  mvp_stats TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leaks table
CREATE TABLE public.leaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  credibility TEXT NOT NULL,
  author TEXT NOT NULL,
  reactions INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.champions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaks ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access and admin write access
-- Teams policies
CREATE POLICY "Teams are viewable by everyone" 
ON public.teams 
FOR SELECT 
USING (true);

CREATE POLICY "Teams can be inserted by anyone" 
ON public.teams 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Teams can be updated by anyone" 
ON public.teams 
FOR UPDATE 
USING (true);

CREATE POLICY "Teams can be deleted by anyone" 
ON public.teams 
FOR DELETE 
USING (true);

-- Matches policies
CREATE POLICY "Matches are viewable by everyone" 
ON public.matches 
FOR SELECT 
USING (true);

CREATE POLICY "Matches can be inserted by anyone" 
ON public.matches 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Matches can be updated by anyone" 
ON public.matches 
FOR UPDATE 
USING (true);

CREATE POLICY "Matches can be deleted by anyone" 
ON public.matches 
FOR DELETE 
USING (true);

-- Champions policies
CREATE POLICY "Champions are viewable by everyone" 
ON public.champions 
FOR SELECT 
USING (true);

CREATE POLICY "Champions can be inserted by anyone" 
ON public.champions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Champions can be updated by anyone" 
ON public.champions 
FOR UPDATE 
USING (true);

CREATE POLICY "Champions can be deleted by anyone" 
ON public.champions 
FOR DELETE 
USING (true);

-- Leaks policies
CREATE POLICY "Leaks are viewable by everyone" 
ON public.leaks 
FOR SELECT 
USING (true);

CREATE POLICY "Leaks can be inserted by anyone" 
ON public.leaks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Leaks can be updated by anyone" 
ON public.leaks 
FOR UPDATE 
USING (true);

CREATE POLICY "Leaks can be deleted by anyone" 
ON public.leaks 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_champions_updated_at
  BEFORE UPDATE ON public.champions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaks_updated_at
  BEFORE UPDATE ON public.leaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default matches data
INSERT INTO public.matches (match_id, team1, team2, round, status) VALUES
  ('qf1', 'Lightning Strike', 'Shadow Wolves', 'Round 1', 'upcoming'),
  ('qf2', 'Phoenix Rising', 'Ice Breakers', 'Round 1', 'upcoming'),
  ('qf3', 'Thunder Hawks', 'Neon Nights', 'Round 1', 'upcoming'),
  ('qf4', 'Cyber Storm', 'Flame Guardians', 'Round 1', 'upcoming'),
  ('sf1', 'TBD', 'TBD', 'Semi Finals', 'upcoming'),
  ('sf2', 'TBD', 'TBD', 'Semi Finals', 'upcoming'),
  ('final', 'TBD', 'TBD', 'Finals', 'upcoming');

-- Insert default teams data
INSERT INTO public.teams (name, captain, members, wins, losses, region, founded) VALUES
  ('Lightning Strike', 'Alex Thunder', ARRAY['Alex Thunder', 'Maya Storm', 'Jake Lightning', 'Sara Bolt', 'Max Power'], 15, 3, 'North America', '2022-03-15'),
  ('Shadow Wolves', 'Marcus Dark', ARRAY['Marcus Dark', 'Luna Shadow', 'Rex Wolf', 'Aria Night', 'Zane Black'], 12, 6, 'Europe', '2021-11-08'),
  ('Phoenix Rising', 'Emma Fire', ARRAY['Emma Fire', 'Leo Flame', 'Ruby Blaze', 'Ash Phoenix', 'Nova Burn'], 14, 4, 'Asia Pacific', '2022-01-22'),
  ('Ice Breakers', 'Crystal Frost', ARRAY['Crystal Frost', 'Ivan Ice', 'Elsa Cold', 'Winter Snow', 'Glacier Peak'], 11, 7, 'Europe', '2021-09-30'),
  ('Thunder Hawks', 'Storm Eagle', ARRAY['Storm Eagle', 'Hawk Eye', 'Thunder Wing', 'Sky Hunter', 'Wind Rider'], 13, 5, 'South America', '2022-02-14'),
  ('Neon Nights', 'Cyber Glow', ARRAY['Cyber Glow', 'Neon Flash', 'Digital Dream', 'Electric Pulse', 'Laser Beam'], 10, 8, 'Asia Pacific', '2021-12-05'),
  ('Cyber Storm', 'Tech Master', ARRAY['Tech Master', 'Code Warrior', 'Byte Fighter', 'Data Surge', 'System Shock'], 16, 2, 'North America', '2021-10-18'),
  ('Flame Guardians', 'Inferno Shield', ARRAY['Inferno Shield', 'Fire Guard', 'Flame Keeper', 'Burn Protector', 'Heat Defender'], 9, 9, 'Europe', '2022-04-03');

-- Insert default champions data  
INSERT INTO public.champions (season, team_name, captain, members, final_score, mvp_name, mvp_stats, notes) VALUES
  ('Winter 2023', 'Lightning Strike', 'Alex Thunder', ARRAY['Alex Thunder', 'Maya Storm', 'Jake Lightning', 'Sara Bolt'], '3-1', 'Alex Thunder', '25 eliminations, 95% accuracy, 15 assists', 'Dominant performance throughout the tournament with exceptional teamwork and strategic plays.'),
  ('Fall 2023', 'Cyber Storm', 'Tech Master', ARRAY['Tech Master', 'Code Warrior', 'Byte Fighter', 'Data Surge'], '3-2', 'Tech Master', '30 eliminations, 12 clutch plays, 18 assists', 'Incredible comeback in the finals after being down 0-2. Historic performance by Tech Master in the final rounds.'),
  ('Summer 2023', 'Phoenix Rising', 'Emma Fire', ARRAY['Emma Fire', 'Leo Flame', 'Ruby Blaze', 'Ash Phoenix'], '3-0', 'Leo Flame', '28 eliminations, 22 assists, 8 MVP rounds', 'Perfect season culminating in a flawless finals performance. Leo Flame set new records for consistency.');

-- Insert default leaks data
INSERT INTO public.leaks (title, content, type, credibility, author, reactions, comments) VALUES
  ('New Map "Neon City" Coming Next Update', 'Sources close to the development team suggest a cyberpunk-themed map is in final testing phases. The map features verticality with multiple levels and neon-lit environments perfect for both aggressive and tactical gameplay.', 'Map Update', 'High', 'DataMiner_X', 234, 45),
  ('Weapon Balance Changes Leaked', 'Internal testing documents reveal significant changes to assault rifle damage and sniper rifle scope-in times. The changes aim to create more balanced mid-range combat scenarios.', 'Balance Update', 'Medium', 'ProGamer_Intel', 189, 67),
  ('Tournament Prize Pool Increase Rumors', 'Multiple tournament organizers hint at a substantial increase in prize pools for the upcoming season. Some sources suggest it could reach unprecedented levels in competitive gaming.', 'Tournament News', 'Low', 'TourneyTracker', 156, 23),
  ('Anti-Cheat System Overhaul', 'Reliable sources indicate a major anti-cheat system update is coming that will use advanced AI detection methods. This could significantly impact the competitive integrity of matches.', 'System Update', 'High', 'SecurityAnalyst', 298, 81),
  ('Mobile Version in Development', 'Leaked development footage suggests a mobile version of the game is in early alpha testing. The mobile version appears to maintain core gameplay while adapting controls for touch interfaces.', 'Platform Expansion', 'Medium', 'MobileGamer_Pro', 445, 102);