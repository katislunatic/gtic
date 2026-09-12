-- Voting system: campaigns (e.g. "Best Staff Vote") -> categories (the
-- individual questions/polls inside a campaign, e.g. "Best at Answering
-- Tickets") -> options (the things people vote for) -> votes.
--
-- A campaign with a single category behaves like a plain YouTube-style poll.
-- A campaign with multiple categories is the "vote for best in each
-- category" format.

CREATE TABLE public.voting_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  -- draft: admin-only, hidden from everyone else.
  -- active: live and votable.
  -- ended: voting closed, no longer accepts votes.
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended')),
  -- live: results visible to everyone, always.
  -- after_vote: results visible to a voter only after THEY vote in that category.
  -- reveal: results hidden from everyone until results_revealed is flipped on.
  -- admin_only: results are never shown publicly, only in the admin view.
  results_mode TEXT NOT NULL DEFAULT 'live' CHECK (results_mode IN ('live', 'after_vote', 'reveal', 'admin_only')),
  results_revealed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.voting_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.voting_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.voting_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.voting_categories(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.voting_categories(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.voting_options(id) ON DELETE CASCADE,
  -- Persistent anonymous id generated client-side and stored in
  -- localStorage — this is the "once per browser" half of the limit.
  voter_key TEXT NOT NULL,
  -- Present when the voter was logged into Discord at vote time — this is
  -- the "once per account" half. A vote can have one, the other, or both;
  -- either match blocks a second vote in the same category.
  discord_user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (category_id, voter_key)
);

-- Enforces "once per Discord account per category" the same way the
-- UNIQUE(category_id, voter_key) column constraint enforces "once per
-- browser" — a partial index since discord_user_id is nullable.
CREATE UNIQUE INDEX votes_category_discord_unique
  ON public.votes (category_id, discord_user_id)
  WHERE discord_user_id IS NOT NULL;

CREATE INDEX votes_category_option_idx ON public.votes (category_id, option_id);

ALTER TABLE public.voting_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Same open-RLS pattern as the rest of the app (shop_products, etc.) —
-- writes are gated in the UI by the isAdmin flag, not by RLS.
CREATE POLICY "Voting campaigns are viewable by everyone" ON public.voting_campaigns FOR SELECT USING (true);
CREATE POLICY "Voting campaigns can be inserted by anyone" ON public.voting_campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Voting campaigns can be updated by anyone" ON public.voting_campaigns FOR UPDATE USING (true);
CREATE POLICY "Voting campaigns can be deleted by anyone" ON public.voting_campaigns FOR DELETE USING (true);

CREATE POLICY "Voting categories are viewable by everyone" ON public.voting_categories FOR SELECT USING (true);
CREATE POLICY "Voting categories can be inserted by anyone" ON public.voting_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Voting categories can be updated by anyone" ON public.voting_categories FOR UPDATE USING (true);
CREATE POLICY "Voting categories can be deleted by anyone" ON public.voting_categories FOR DELETE USING (true);

CREATE POLICY "Voting options are viewable by everyone" ON public.voting_options FOR SELECT USING (true);
CREATE POLICY "Voting options can be inserted by anyone" ON public.voting_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Voting options can be updated by anyone" ON public.voting_options FOR UPDATE USING (true);
CREATE POLICY "Voting options can be deleted by anyone" ON public.voting_options FOR DELETE USING (true);

-- Votes: everyone can read (counts are computed client-side and hidden/shown
-- per results_mode) and cast; only admins delete (e.g. "reset results"),
-- gated in the UI same as everything else.
CREATE POLICY "Votes are viewable by everyone" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Votes can be inserted by anyone" ON public.votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Votes can be deleted by anyone" ON public.votes FOR DELETE USING (true);

CREATE TRIGGER update_voting_campaigns_updated_at
  BEFORE UPDATE ON public.voting_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();