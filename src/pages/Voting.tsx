import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  useVotingCampaigns,
  useCategoryVotes,
  optionDisplayName,
  lookupDiscordUser,
  type VotingCampaign,
  type VotingCategory,
  type VotingOption,
  type ResultsMode,
} from "@/hooks/use-voting";
import {
  Vote,
  Trophy,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Public voting flow — one category at a time, Streamer-Awards-style pager.
// ---------------------------------------------------------------------------

const OptionCard = ({
  option,
  selected,
  locked,
  votedForThis,
  onClick,
}: {
  option: VotingOption;
  selected: boolean;
  locked: boolean;
  votedForThis: boolean;
  onClick: () => void;
}) => {
  const name = optionDisplayName(option);
  const photo = option.image_url;

  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`group relative overflow-hidden rounded-lg border-2 text-left transition-all duration-200 ${
        selected || votedForThis
          ? "border-secondary shadow-[0_0_0_3px_hsl(var(--secondary)/0.25)]"
          : "border-border hover:border-secondary/50"
      } ${locked && !votedForThis ? "opacity-50" : ""}`}
    >
      <div className="aspect-square w-full bg-muted overflow-hidden">
        {photo ? (
          <img src={photo} alt={name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        {(selected || votedForThis) && (
          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
            <Check className="h-4 w-4 text-secondary-foreground" />
          </div>
        )}
      </div>
      <div
        className="px-2 py-2 text-center font-semibold text-sm truncate"
        style={{
          background: "linear-gradient(135deg, hsl(48 95% 60%), hsl(32 95% 50%))",
          color: "#1a1206",
        }}
      >
        {name}
      </div>
    </button>
  );
};

const ResultsBars = ({
  options,
  counts,
  total,
  myVoteOptionId,
}: {
  options: VotingOption[];
  counts: Record<string, number>;
  total: number;
  myVoteOptionId: string | null;
}) => (
  <div className="space-y-2 mt-4">
    {options.map((opt) => {
      const c = counts[opt.id] ?? 0;
      const pct = total > 0 ? Math.round((c / total) * 100) : 0;
      const isMine = myVoteOptionId === opt.id;
      return (
        <div key={opt.id} className="relative overflow-hidden rounded-md border border-border">
          <div
            className="absolute inset-y-0 left-0 bg-secondary/20 transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
          <div className="relative flex items-center justify-between gap-2 px-3 py-2 text-sm">
            <span className={`truncate font-medium ${isMine ? "text-secondary" : ""}`}>{optionDisplayName(opt)}</span>
            <span className="shrink-0 font-semibold tabular-nums">
              {pct}% <span className="text-muted-foreground font-normal">({c})</span>
            </span>
          </div>
        </div>
      );
    })}
  </div>
);

const CategoryVotingPanel = ({ category, campaign }: { category: VotingCategory; campaign: VotingCampaign }) => {
  const { counts, total, myVoteOptionId, loading, castVote } = useCategoryVotes(category.id);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSelected(null);
  }, [category.id]);

  const canSeeResults =
    campaign.results_mode === "live" ||
    (campaign.results_mode === "after_vote" && !!myVoteOptionId) ||
    (campaign.results_mode === "reveal" && campaign.results_revealed);

  const hasVoted = !!myVoteOptionId;
  const votingOpen = campaign.status === "active";

  const submit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    const { error } = await castVote(selected);
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't submit", description: "Looks like you've already voted here.", variant: "destructive" });
      return;
    }
    toast({ title: "Vote submitted!" });
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-2">
        <Trophy className="h-6 w-6 text-secondary shrink-0" />
        {category.title}
      </h2>
      {!votingOpen && <p className="text-sm text-muted-foreground mb-4">Voting has closed for this category.</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
        {category.options.map((opt) => (
          <OptionCard
            key={opt.id}
            option={opt}
            selected={selected === opt.id}
            locked={!votingOpen || hasVoted || loading}
            votedForThis={myVoteOptionId === opt.id}
            onClick={() => votingOpen && !hasVoted && setSelected(opt.id)}
          />
        ))}
        {category.options.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">No options have been added to this category yet.</p>
        )}
      </div>

      {canSeeResults && !loading && (
        <ResultsBars options={category.options} counts={counts} total={total} myVoteOptionId={myVoteOptionId} />
      )}
      {!canSeeResults && (
        <p className="text-xs text-muted-foreground mt-4">
          {campaign.results_mode === "reveal"
            ? "Results will be revealed once voting ends."
            : campaign.results_mode === "after_vote"
            ? "Vote to see live results."
            : "Results aren't public for this vote."}
        </p>
      )}

      {votingOpen && !hasVoted && category.options.length > 0 && (
        <div className="flex justify-end mt-6">
          <Button onClick={submit} disabled={!selected || submitting} className="gap-2 min-w-32">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit Vote
          </Button>
        </div>
      )}
    </div>
  );
};

const CampaignVotingFlow = ({ campaign }: { campaign: VotingCampaign }) => {
  const [index, setIndex] = useState(0);
  const categories = campaign.categories;
  const current = categories[index];

  useEffect(() => setIndex(0), [campaign.id]);

  if (categories.length === 0) {
    return <p className="text-center text-muted-foreground py-10">This vote doesn't have any categories yet.</p>;
  }

  return (
    <div>
      <div className="text-center mb-10">
        <h1
          className="text-4xl sm:text-6xl font-black tracking-wide bg-clip-text text-transparent inline-block"
          style={{ backgroundImage: "linear-gradient(135deg, hsl(48 95% 60%), hsl(32 95% 50%))" }}
        >
          VOTE NOW
        </h1>
        <h2 className="text-xl font-bold mt-2">{campaign.title}</h2>
        {campaign.description && <p className="text-muted-foreground mt-1 max-w-xl mx-auto">{campaign.description}</p>}
      </div>

      {/* Pager — Previous / step dots / Next, Streamer-Awards style */}
      {categories.length > 1 && (
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <div className="flex items-center gap-2">
            {categories.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => setIndex(i)}
                aria-label={`Go to ${cat.title}`}
                className={`h-2.5 w-2.5 rotate-45 transition-all ${
                  i === index ? "bg-secondary scale-125" : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setIndex((i) => Math.min(categories.length - 1, i + 1))}
            disabled={index === categories.length - 1}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <CategoryVotingPanel key={current.id} category={current} campaign={campaign} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Admin management
// ---------------------------------------------------------------------------

const emptyCampaignForm = { title: "", slug: "", description: "", results_mode: "live" as ResultsMode };

// The "add option" row: either paste a Discord ID (auto-fetches name +
// avatar) or fill in a manual label/image. Kept as its own component so
// each category's add-row has independent lookup state.
const AddOptionRow = ({ categoryId, onAdded }: { categoryId: string; onAdded: () => void }) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<"discord" | "manual">("discord");
  const [discordId, setDiscordId] = useState("");
  const [looking, setLooking] = useState(false);
  const [fetched, setFetched] = useState<{ display_name: string; avatar_url: string } | null>(null);
  const [nameOverride, setNameOverride] = useState("");
  const [manualLabel, setManualLabel] = useState("");
  const [manualImage, setManualImage] = useState("");
  const [saving, setSaving] = useState(false);

  const runLookup = async () => {
    if (!discordId.trim()) return;
    setLooking(true);
    const result = await lookupDiscordUser(discordId.trim());
    setLooking(false);
    if ("error" in result) {
      toast({ title: "Couldn't find that user", description: result.error, variant: "destructive" });
      setFetched(null);
      return;
    }
    setFetched({ display_name: result.display_name, avatar_url: result.avatar_url });
    setNameOverride(result.display_name);
  };

  const addDiscordOption = async () => {
    if (!fetched) return;
    setSaving(true);
    const { error } = await supabase.from("voting_options").insert({
      category_id: categoryId,
      label: fetched.display_name,
      image_url: fetched.avatar_url,
      discord_user_id: discordId.trim(),
      display_name_override: nameOverride.trim() !== fetched.display_name ? nameOverride.trim() : null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't add option", description: error.message, variant: "destructive" });
      return;
    }
    setDiscordId("");
    setFetched(null);
    setNameOverride("");
    onAdded();
  };

  const addManualOption = async () => {
    if (!manualLabel.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("voting_options").insert({
      category_id: categoryId,
      label: manualLabel.trim(),
      image_url: manualImage.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't add option", description: error.message, variant: "destructive" });
      return;
    }
    setManualLabel("");
    setManualImage("");
    onAdded();
  };

  return (
    <div className="rounded-md border border-dashed border-border p-2.5 space-y-2">
      <div className="flex gap-1 text-[11px]">
        <button
          onClick={() => setMode("discord")}
          className={`px-2 py-0.5 rounded-full ${mode === "discord" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          By Discord ID
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`px-2 py-0.5 rounded-full ${mode === "manual" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          Manual
        </button>
      </div>

      {mode === "discord" ? (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            <Input
              placeholder="Discord user ID"
              className="h-7 text-xs"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runLookup()}
            />
            <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={runLookup} disabled={looking || !discordId.trim()}>
              {looking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Fetch"}
            </Button>
          </div>
          {fetched && (
            <div className="flex items-center gap-2 bg-muted/40 rounded-md p-2">
              <img src={fetched.avatar_url} alt="" className="h-8 w-8 rounded-full shrink-0" />
              <Input
                className="h-7 text-xs flex-1"
                value={nameOverride}
                onChange={(e) => setNameOverride(e.target.value)}
                placeholder="Display name"
              />
              <Button size="sm" className="h-7 text-xs shrink-0" onClick={addDiscordOption} disabled={saving}>
                Add
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-1.5">
          <Input
            placeholder="Name / label"
            className="h-7 text-xs"
            value={manualLabel}
            onChange={(e) => setManualLabel(e.target.value)}
          />
          <Input
            placeholder="Image URL (optional)"
            className="h-7 text-xs"
            value={manualImage}
            onChange={(e) => setManualImage(e.target.value)}
          />
          <Button size="sm" className="h-7 text-xs shrink-0" onClick={addManualOption} disabled={saving || !manualLabel.trim()}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
};

const AdminVotingManager = ({ campaigns, reload }: { campaigns: VotingCampaign[]; reload: () => void }) => {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyCampaignForm);
  const [creating, setCreating] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState<Record<string, string>>({});

  const createCampaign = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    const slug = form.slug.trim() || form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error } = await supabase.from("voting_campaigns").insert({
      title: form.title.trim(),
      slug,
      description: form.description.trim(),
      results_mode: form.results_mode,
      status: "draft",
    });
    setCreating(false);
    if (error) {
      toast({ title: "Couldn't create vote", description: error.message, variant: "destructive" });
      return;
    }
    setForm(emptyCampaignForm);
    toast({ title: "Vote created", description: "It starts as a draft — set it Active when ready." });
    reload();
  };

  const updateCampaign = async (id: string, patch: Partial<VotingCampaign>) => {
    const { error } = await supabase.from("voting_campaigns").update(patch).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    reload();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Delete this vote and all its categories, options, and votes? This can't be undone.")) return;
    const { error } = await supabase.from("voting_campaigns").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    reload();
  };

  const addCategory = async (campaignId: string) => {
    const title = newCategoryTitle[campaignId]?.trim();
    if (!title) return;
    const { error } = await supabase.from("voting_categories").insert({ campaign_id: campaignId, title });
    if (error) toast({ title: "Couldn't add category", description: error.message, variant: "destructive" });
    setNewCategoryTitle((s) => ({ ...s, [campaignId]: "" }));
    reload();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category and its options/votes?")) return;
    await supabase.from("voting_categories").delete().eq("id", id);
    reload();
  };

  const deleteOption = async (id: string) => {
    await supabase.from("voting_options").delete().eq("id", id);
    reload();
  };

  return (
    <div className="mb-14 space-y-6">
      <div
        className="rounded-xl border p-5 sm:p-6"
        style={{ borderColor: "hsl(42 92% 55% / 0.35)", background: "hsl(42 92% 55% / 0.04)" }}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5" style={{ color: "hsl(42 92% 55%)" }} /> Manage Voting (admin)
        </h2>

        {/* New campaign form */}
        <div className="space-y-3 mb-6 p-4 rounded-lg bg-muted/30">
          <p className="text-sm font-medium">Create a new vote</p>
          <Input
            placeholder='Title, e.g. "Best Staff Vote"'
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="min-h-16"
          />
          <div className="flex items-center gap-2">
            <Label className="text-xs shrink-0 w-32">Results visibility</Label>
            <select
              className="text-xs border rounded-md bg-background px-2 py-1.5 flex-1"
              value={form.results_mode}
              onChange={(e) => setForm((f) => ({ ...f, results_mode: e.target.value as ResultsMode }))}
            >
              <option value="live">Live — everyone sees counts as they come in</option>
              <option value="after_vote">After vote — voter sees counts once they've voted</option>
              <option value="reveal">Reveal — hidden until you reveal them</option>
              <option value="admin_only">Admin only — never shown publicly</option>
            </select>
          </div>
          <Button size="sm" onClick={createCampaign} disabled={creating || !form.title.trim()} className="gap-1.5">
            <Plus className="h-4 w-4" /> Create Vote
          </Button>
        </div>

        {/* Existing campaigns */}
        <div className="space-y-4">
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-xs text-muted-foreground">/{c.slug} · {c.results_mode.replace("_", " ")}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteCampaign(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Active</Label>
                  <Switch
                    checked={c.status === "active"}
                    onCheckedChange={(v) => updateCampaign(c.id, { status: v ? "active" : "draft" })}
                  />
                </div>
                <Button
                  size="sm"
                  variant={c.status === "ended" ? "secondary" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => updateCampaign(c.id, { status: c.status === "ended" ? "active" : "ended" })}
                >
                  {c.status === "ended" ? "Reopen" : "End voting"}
                </Button>
                {c.results_mode === "reveal" && (
                  <Button
                    size="sm"
                    variant={c.results_revealed ? "secondary" : "outline"}
                    className="h-7 text-xs gap-1"
                    onClick={() => updateCampaign(c.id, { results_revealed: !c.results_revealed })}
                  >
                    {c.results_revealed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {c.results_revealed ? "Results revealed" : "Reveal results"}
                  </Button>
                )}
              </div>

              {/* Categories */}
              <div className="space-y-3 pl-3 border-l-2 border-border">
                {c.categories.map((cat) => (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{cat.title}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteCategory(cat.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-2">
                      {cat.options.map((opt) => (
                        <span key={opt.id} className="inline-flex items-center gap-1.5 text-xs bg-muted rounded-full px-2 py-1">
                          {opt.image_url && <img src={opt.image_url} alt="" className="h-4 w-4 rounded-full" />}
                          {optionDisplayName(opt)}
                          <button onClick={() => deleteOption(opt.id)} aria-label="Remove option">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="pl-2">
                      <AddOptionRow categoryId={cat.id} onAdded={reload} />
                    </div>
                  </div>
                ))}
                <div className="flex gap-1.5 pt-1">
                  <Input
                    placeholder='New category, e.g. "Best at Helping"'
                    className="h-7 text-xs"
                    value={newCategoryTitle[c.id] ?? ""}
                    onChange={(e) => setNewCategoryTitle((s) => ({ ...s, [c.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addCategory(c.id)}
                  />
                  <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => addCategory(c.id)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------

export const Voting = ({ isAdmin }: { isAdmin: boolean }) => {
  const { campaigns, loading, reload } = useVotingCampaigns();
  const visibleCampaigns = campaigns.filter((c) => c.status !== "draft" || isAdmin);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCampaignId && visibleCampaigns.length > 0) setActiveCampaignId(visibleCampaigns[0].id);
  }, [visibleCampaigns, activeCampaignId]);

  const activeCampaign = visibleCampaigns.find((c) => c.id === activeCampaignId) ?? visibleCampaigns[0];

  return (
    <div className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
      {isAdmin && <AdminVotingManager campaigns={campaigns} reload={reload} />}

      {loading ? (
        <p className="text-center text-muted-foreground">Loading votes…</p>
      ) : visibleCampaigns.length === 0 ? (
        <div className="text-center py-16">
          <Vote className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No votes are open right now — check back soon.</p>
        </div>
      ) : (
        <>
          {visibleCampaigns.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {visibleCampaigns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCampaignId(c.id)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    c.id === activeCampaign?.id
                      ? "border-secondary bg-secondary/15 text-secondary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.title}
                  {c.status === "ended" && <span className="ml-1.5 opacity-60">(closed)</span>}
                </button>
              ))}
            </div>
          )}
          {activeCampaign && <CampaignVotingFlow campaign={activeCampaign} />}
        </>
      )}
    </div>
  );
};

export default Voting;
