import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Pencil, Check, X, Volume2 } from "lucide-react";
import { fetchPlayer, logoUrl, updateMyBio } from "@/lib/gtecApi";
import { useDiscordAuth } from "@/hooks/use-discord-auth";
import { useToast } from "@/hooks/use-toast";
import { speakName } from "@/lib/pronounceName";

const BIO_MAX = 200;

export const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useDiscordAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: player, isLoading, isError } = useQuery({
    queryKey: ["gtec-player", id],
    queryFn: () => fetchPlayer(id as string),
    enabled: !!id,
    staleTime: 60_000,
  });

  const isOwnProfile = !!profile && profile.discord_user_id === id;
  const [editingBio, setEditingBio] = useState(false);
  const [draftBio, setDraftBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (player) setDraftBio(player.bio ?? "");
  }, [player]);

  const saveBio = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateMyBio(id, draftBio);
      await queryClient.invalidateQueries({ queryKey: ["gtec-player", id] });
      setEditingBio(false);
      toast({ title: "Bio updated" });
    } catch (err) {
      toast({ title: "Failed to save", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 md:pt-36 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="h-40 rounded-lg bg-muted/20 animate-pulse mb-6" />
          <div className="h-64 rounded-lg bg-muted/20 animate-pulse" />
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !player) {
    return (
      <div className="min-h-screen pt-28 md:pt-36 pb-16">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <p className="text-lg font-medium mb-2">Player not found</p>
          <Link to="/players" className="text-primary hover:underline">
            <ArrowLeft className="inline h-4 w-4 mr-1" /> Back to players
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 md:pt-36 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link to="/players" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center mb-8">
          <ArrowLeft className="h-4 w-4 mr-1" /> All players
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: identity, bio */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="team-card">
              <CardContent className="p-6 flex items-center gap-4">
                <img
                  src={player.identity.avatarUrl}
                  alt={player.identity.displayName}
                  className="h-20 w-20 rounded-full border flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold truncate">{player.identity.displayName}</h1>
                    <button
                      type="button"
                      onClick={() => speakName(player.identity.displayName)}
                      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                      title="Hear name pronounced"
                      aria-label="Hear name pronounced"
                    >
                      <Volume2 className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-muted-foreground text-sm">@{player.identity.username}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="team-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-muted-foreground">Bio</h2>
                  {isOwnProfile && !editingBio && (
                    <Button variant="ghost" size="sm" onClick={() => setEditingBio(true)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                  )}
                </div>

                {editingBio ? (
                  <div className="space-y-2">
                    <Textarea
                      value={draftBio}
                      onChange={(e) => setDraftBio(e.target.value.slice(0, BIO_MAX))}
                      rows={4}
                      placeholder="Say something about yourself..."
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{draftBio.length}/{BIO_MAX}</span>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveBio} disabled={saving}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={saving}
                          onClick={() => {
                            setDraftBio(player.bio ?? "");
                            setEditingBio(false);
                          }}
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : player.bio ? (
                  <p className="whitespace-pre-wrap">{player.bio}</p>
                ) : (
                  <p className="text-muted-foreground text-sm italic">
                    {isOwnProfile ? "You haven't set a bio yet." : "No bio set."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: current team, then past teams */}
          <div className="space-y-6">
            <Card className="team-card">
              <CardContent className="p-6">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">Current Team</h2>
                {player.team ? (
                  <Link
                    to={`/teams/${player.team.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div
                      className="h-12 w-12 rounded-md flex-shrink-0 overflow-hidden border"
                      style={{ borderColor: player.team.color, backgroundColor: `${player.team.color}22` }}
                    >
                      {player.team.hasLogo && (
                        <img src={logoUrl(player.team.id)} alt={player.team.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate" style={player.team.official ? { color: "#3392FF" } : undefined}>
                        {player.team.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{player.team.myRole}</p>
                    </div>
                  </Link>
                ) : (
                  <p className="text-muted-foreground text-sm italic">Not currently on a team.</p>
                )}
              </CardContent>
            </Card>

            <Card className="team-card">
              <CardContent className="p-6">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">Past Teams</h2>
                {player.pastTeams.length > 0 ? (
                  <ul className="space-y-1.5 text-sm">
                    {player.pastTeams.map((name) => (
                      <li key={name} className="text-muted-foreground p-2 rounded bg-muted/10">
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm italic">No past teams on record.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
