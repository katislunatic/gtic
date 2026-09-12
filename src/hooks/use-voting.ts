import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDiscordAuth } from "@/hooks/use-discord-auth";

export type ResultsMode = "live" | "after_vote" | "reveal" | "admin_only";
export type CampaignStatus = "draft" | "active" | "ended";

export interface VotingOption {
  id: string;
  category_id: string;
  label: string;
  image_url: string | null;
  discord_user_id: string | null;
  display_name_override: string | null;
  sort_order: number;
}

// The name/photo actually shown for an option: an override name wins if
// set, otherwise the label; same for the image.
export const optionDisplayName = (o: VotingOption) => o.display_name_override?.trim() || o.label;

// Looks up a Discord user's current display name + avatar via the
// discord-user-lookup edge function, for the admin "add option" flow.
export const lookupDiscordUser = async (discordUserId: string) => {
  const { data, error } = await supabase.functions.invoke("discord-user-lookup", {
    body: { discord_user_id: discordUserId.trim() },
  });
  const err = error?.message ?? (data as any)?.error;
  if (err) return { error: err as string };
  return data as { discord_user_id: string; username: string; display_name: string; avatar_url: string };
};

export interface VotingCategory {
  id: string;
  campaign_id: string;
  title: string;
  sort_order: number;
  options: VotingOption[];
}

export interface VotingCampaign {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: CampaignStatus;
  results_mode: ResultsMode;
  results_revealed: boolean;
  sort_order: number;
  categories: VotingCategory[];
}

const VOTER_KEY_STORAGE = "gtec-voter-key";

// A persistent anonymous id, generated once and kept in localStorage — this
// is the "once per browser" half of the vote limit. Combined server-side
// with the logged-in Discord id (if any) via a unique index per category.
export const getVoterKey = (): string => {
  if (typeof window === "undefined") return "server";
  let key = window.localStorage.getItem(VOTER_KEY_STORAGE);
  if (!key) {
    key = crypto.randomUUID();
    window.localStorage.setItem(VOTER_KEY_STORAGE, key);
  }
  return key;
};

// Fetches every campaign (with nested categories/options) in one round trip
// via Supabase's embedded-resource select, then sorts everything client-side
// by sort_order.
export const useVotingCampaigns = (opts?: { onlyActive?: boolean }) => {
  const [campaigns, setCampaigns] = useState<VotingCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("voting_campaigns")
      .select("*, voting_categories(*, voting_options(*))")
      .order("sort_order", { ascending: true });

    if (error || !data) {
      setLoading(false);
      return;
    }

    const mapped: VotingCampaign[] = (data as any[])
      .filter((c) => !opts?.onlyActive || c.status === "active")
      .map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        status: c.status,
        results_mode: c.results_mode,
        results_revealed: c.results_revealed,
        sort_order: c.sort_order,
        categories: (c.voting_categories ?? [])
          .slice()
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((cat: any) => ({
            id: cat.id,
            campaign_id: cat.campaign_id,
            title: cat.title,
            sort_order: cat.sort_order,
            options: (cat.voting_options ?? [])
              .slice()
              .sort((a: any, b: any) => a.sort_order - b.sort_order),
          })),
      }));

    setCampaigns(mapped);
    setLoading(false);
  }, [opts?.onlyActive]);

  useEffect(() => {
    load();
  }, [load]);

  return { campaigns, loading, reload: load };
};

// Vote counts + "have I voted, and for what" for a single category. Kept
// separate from useVotingCampaigns so the (heavier, per-vote) query only
// runs for categories actually being displayed/voted in.
export const useCategoryVotes = (categoryId: string | null) => {
  const { profile } = useDiscordAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [myVoteOptionId, setMyVoteOptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    const voterKey = getVoterKey();
    const discordId = profile?.discord_user_id;

    const { data, error } = await supabase
      .from("votes")
      .select("option_id, voter_key, discord_user_id")
      .eq("category_id", categoryId);

    if (error || !data) {
      setLoading(false);
      return;
    }

    const byOption: Record<string, number> = {};
    let mine: string | null = null;
    for (const row of data as any[]) {
      byOption[row.option_id] = (byOption[row.option_id] ?? 0) + 1;
      if (row.voter_key === voterKey || (discordId && row.discord_user_id === discordId)) {
        mine = row.option_id;
      }
    }
    setCounts(byOption);
    setTotal(data.length);
    setMyVoteOptionId(mine);
    setLoading(false);
  }, [categoryId, profile?.discord_user_id]);

  useEffect(() => {
    load();
  }, [load]);

  const castVote = useCallback(
    async (optionId: string) => {
      if (!categoryId || myVoteOptionId) return { error: "already voted" };
      const { error } = await supabase.from("votes").insert({
        category_id: categoryId,
        option_id: optionId,
        voter_key: getVoterKey(),
        discord_user_id: profile?.discord_user_id ?? null,
      });
      // A unique-constraint violation here means another tab/device already
      // cast this exact vote between load() and now — treat it the same as
      // "already voted" rather than surfacing a raw DB error.
      if (!error) await load();
      return { error: error?.message ?? null };
    },
    [categoryId, myVoteOptionId, profile?.discord_user_id, load],
  );

  return { counts, total, myVoteOptionId, loading, castVote, reload: load };
};

// Lightweight check used by the popup/banner: does the current
// visitor have an unvoted category in any currently-active campaign?
// Pulls every vote for active categories in one query rather than one
// query per category.
export const useHasUnvotedActiveCampaign = () => {
  const { campaigns, loading: campaignsLoading } = useVotingCampaigns({ onlyActive: true });
  const { profile } = useDiscordAuth();
  const [hasUnvoted, setHasUnvoted] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (campaignsLoading) return;
      const allCategoryIds = campaigns.flatMap((c) => c.categories.map((cat) => cat.id));
      if (allCategoryIds.length === 0) {
        setHasUnvoted(false);
        setChecked(true);
        return;
      }
      const voterKey = getVoterKey();
      const discordId = profile?.discord_user_id;
      const { data } = await supabase
        .from("votes")
        .select("category_id, voter_key, discord_user_id")
        .in("category_id", allCategoryIds);

      const votedCategoryIds = new Set(
        (data ?? [])
          .filter((r: any) => r.voter_key === voterKey || (discordId && r.discord_user_id === discordId))
          .map((r: any) => r.category_id),
      );
      setHasUnvoted(allCategoryIds.some((id) => !votedCategoryIds.has(id)));
      setChecked(true);
    };
    check();
  }, [campaigns, campaignsLoading, profile?.discord_user_id]);

  return { hasUnvoted, checked, campaigns };
};
