import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Shield, ShieldQuestion, Users, Crown, Star, RotateCw, Pencil, Check, X } from "lucide-react";
import { fetchTeam, logoUrl, resolveDiscordUsers, updateTeamBadges, updateTeamMessage } from "@/lib/gtecApi";
import { useDiscordAuth } from "@/hooks/use-discord-auth";
import { useToast } from "@/hooks/use-toast";

// Sort order for displaying members grouped by role, captain first.
const ROLE_ORDER: Record<string, number> = {
  Captain: 0,
  "Team Executive": 1,
  "Co-Captain": 2,
  "Team Member": 3,
};

export const RosterTeam = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useDiscordAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingBadges, setEditingBadges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingMessage, setEditingMessage] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [savingMessage, setSavingMessage] = useState(false);

  const { data: team, isLoading, isError } = useQuery({
    queryKey: ["gtec-roster-team", id],
    queryFn: () => fetchTeam(id as string),
    enabled: !!id,
    staleTime: 60_000,
  });

  const memberIds = team?.members.map((m) => m.discordUserId) ?? [];
  const { data: identities = {} } = useQuery({
    queryKey: ["gtec-team-member-identities", id],
    queryFn: () => resolveDiscordUsers(memberIds),
    enabled: memberIds.length > 0,
    staleTime: 5 * 60_000,
  });

  const [draftReigning, setDraftReigning] = useState(false);
  const [draftReturning, setDraftReturning] = useState(false);
  const [draftStars, setDraftStars] = useState("0");

  const startEditing = () => {
    if (!team) return;
    setDraftReigning(team.isReigning);
    setDraftReturning(team.isReturning);
    setDraftStars(String(team.stars));
    setEditingBadges(true);
  };

  const saveBadges = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateTeamBadges(id, {
        isReigning: draftReigning,
        isReturning: draftReturning,
        stars: Math.max(0, parseInt(draftStars, 10) || 0),
      });
      await queryClient.invalidateQueries({ queryKey: ["gtec-roster-team", id] });
      await queryClient.invalidateQueries({ queryKey: ["gtec-roster-teams"] });
      setEditingBadges(false);
      toast({ title: "Team badges updated" });
    } catch (err) {
      toast({ title: "Failed to save", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const canEditMessage =
    !!profile && !!team &&
    (team.captainId === profile.discord_user_id ||
      team.executiveId === profile.discord_user_id ||
      team.coCaptains.includes(profile.discord_user_id));

  const saveMessage = async () => {
    if (!id) return;
    setSavingMessage(true);
    try {
      await updateTeamMessage(id, draftMessage);
      await queryClient.invalidateQueries({ queryKey: ["gtec-roster-team", id] });
      setEditingMessage(false);
      toast({ title: "Team message updated" });
    } catch (err) {
      toast({ title: "Failed to save", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSavingMessage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 md:pt-36 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="h-40 rounded-lg bg-muted/20 animate-pulse mb-6" />
          <div className="h-64 rounded-lg bg-muted/20 animate-pulse" />
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div className="min-h-screen pt-28 md:pt-36 pb-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="text-lg font-medium mb-2">Team not found</p>
          <Link to="/teams" className="text-primary hover:underline">
            <ArrowLeft className="inline h-4 w-4 mr-1" /> Back to all teams
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const sortedMembers = [...team.members].sort(
    (a, b) => (ROLE_ORDER[a.role ?? ""] ?? 9) - (ROLE_ORDER[b.role ?? ""] ?? 9)
  );

  return (
    <div className="min-h-screen pt-28 md:pt-36 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link to="/teams" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center mb-8">
          <ArrowLeft className="h-4 w-4 mr-1" /> All teams
        </Link>

        <Card className="team-card mb-6">
          <CardContent className="p-6 md:p-8 flex items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              <div
                className="h-20 w-20 rounded-lg flex-shrink-0 overflow-hidden border flex items-center justify-center"
                style={{ borderColor: team.color, backgroundColor: `${team.color}22` }}
              >
                {team.hasLogo ? (
                  <img src={logoUrl(team.id)} alt={`${team.name} logo`} className="h-full w-full object-cover" />
                ) : (
                  <Users className="h-8 w-8" style={{ color: team.color }} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold" style={team.official ? { color: "#3392FF" } : undefined}>
                    {team.name}
                  </h1>
                  {team.official ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                      <Shield className="h-3 w-3" /> Official
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                      <ShieldQuestion className="h-3 w-3" /> Unofficial
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-1">{team.tag}</p>
                <div className="flex items-center gap-3 mt-2">
                  {team.isReigning && (
                    <span className="flex items-center gap-1 text-xs text-yellow-400">
                      <Crown className="h-4 w-4" /> Reigning Champion
                    </span>
                  )}
                  {team.isReturning && (
                    <span className="flex items-center gap-1 text-xs text-sky-400">
                      <RotateCw className="h-4 w-4" /> Returning Team
                    </span>
                  )}
                  {team.stars > 0 && (
                    <span className="flex items-center gap-1 text-xs text-yellow-400">
                      <Star className="h-4 w-4 fill-current" /> {team.stars} Past Champion{team.stars === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {isAdmin && !editingBadges && (
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Badges
              </Button>
            )}
          </CardContent>

          {isAdmin && editingBadges && (
            <CardContent className="px-6 md:px-8 pb-6 pt-0 border-t border-border/50 mt-2">
              <div className="flex flex-wrap items-end gap-4 pt-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draftReigning}
                    onChange={(e) => setDraftReigning(e.target.checked)}
                  />
                  <Crown className="h-4 w-4 text-yellow-400" /> Reigning Champion
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draftReturning}
                    onChange={(e) => setDraftReturning(e.target.checked)}
                  />
                  <RotateCw className="h-4 w-4 text-sky-400" /> Returning Team
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" /> Past Champion Stars
                  <Input
                    type="number"
                    min={0}
                    value={draftStars}
                    onChange={(e) => setDraftStars(e.target.value)}
                    className="w-20 h-8"
                  />
                </label>
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" onClick={saveBadges} disabled={saving}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingBadges(false)} disabled={saving}>
                    <X className="h-3.5 w-3.5 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {(team.teamMessage || canEditMessage) && (
          <Card className="team-card mb-6">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-muted-foreground">Message from the team</h2>
                {canEditMessage && !editingMessage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDraftMessage(team.teamMessage ?? "");
                      setEditingMessage(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                  </Button>
                )}
              </div>

              {editingMessage ? (
                <div className="space-y-2">
                  <Textarea
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value.slice(0, 500))}
                    rows={4}
                    placeholder="Say something about your team..."
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{draftMessage.length}/500</span>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveMessage} disabled={savingMessage}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" disabled={savingMessage} onClick={() => setEditingMessage(false)}>
                        <X className="h-3.5 w-3.5 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : team.teamMessage ? (
                <p className="whitespace-pre-wrap">{team.teamMessage}</p>
              ) : (
                <p className="text-muted-foreground text-sm italic">No message set yet.</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="team-card">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-5">
              Players ({sortedMembers.length})
            </h2>
            {sortedMembers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No players on this team yet.</p>
            ) : (
              <ul className="space-y-2">
                {sortedMembers.map((m) => {
                  const identity = identities[m.discordUserId];
                  return (
                    <li key={m.discordUserId}>
                      <Link
                        to={`/players/${m.discordUserId}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          {identity ? (
                            <img
                              src={identity.avatarUrl}
                              alt={identity.displayName}
                              className="h-8 w-8 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0 animate-pulse" />
                          )}
                          <span className="truncate font-medium">
                            {identity ? identity.displayName : m.discordUserId}
                          </span>
                        </span>
                        {m.role && (
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">({m.role})</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};
