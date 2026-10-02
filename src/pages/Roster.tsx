import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { Shield, ShieldQuestion, Users, Crown, Star, RotateCw, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchTeams, fetchPlayer, logoUrl, type GtecTeam } from "@/lib/gtecApi";
import { useDiscordAuth } from "@/hooks/use-discord-auth";

type TierFilter = "all" | "official" | "unofficial";

export const Roster = () => {
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<TierFilter>("all");
  const { profile } = useDiscordAuth();

  const { data: teams = [], isLoading, isError } = useQuery({
    queryKey: ["gtec-roster-teams"],
    queryFn: () => fetchTeams({ official: "all" }),
    staleTime: 60_000,
  });

  // Checked so the "Create a Team" button can hide itself for someone who's
  // already on one -- shares its cache key with PlayerProfile.tsx, so this
  // is usually a no-op network request if they've viewed their own profile
  // already this session.
  const { data: myPlayer } = useQuery({
    queryKey: ["gtec-player", profile?.discord_user_id],
    queryFn: () => fetchPlayer(profile!.discord_user_id),
    enabled: !!profile?.discord_user_id,
    staleTime: 60_000,
  });
  const alreadyOnATeam = !!myPlayer?.team;

  const filtered = useMemo(() => {
    let list = teams;
    if (tier === "official") list = list.filter((t) => t.official);
    if (tier === "unofficial") list = list.filter((t) => !t.official);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) => t.name.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q)
      );
    }
    return list;
  }, [teams, tier, search]);

  return (
    <div className="min-h-screen pt-28 md:pt-36 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="hero-text">Teams</span>
          </h1>
          <p className="text-muted-foreground mb-5">Browse every official and unofficial GTEC team.</p>
          {!alreadyOnATeam && (
            <Link to="/teams/create">
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> Create a Team
              </Button>
            </Link>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-10 max-w-xl mx-auto">
          <Input
            placeholder="Search by team name or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2 justify-center">
            <Button
              type="button"
              size="sm"
              variant={tier === "all" ? "default" : "outline"}
              onClick={() => setTier("all")}
            >
              All
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tier === "official" ? "default" : "outline"}
              onClick={() => setTier("official")}
            >
              <Shield className="mr-1 h-3.5 w-3.5" /> Official
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tier === "unofficial" ? "default" : "outline"}
              onClick={() => setTier("unofficial")}
            >
              <ShieldQuestion className="mr-1 h-3.5 w-3.5" /> Unofficial
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted/20 animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <Card className="team-card">
            <CardContent className="p-8 text-center text-muted-foreground">
              Couldn't reach the team list right now. Try again in a moment.
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="team-card">
            <CardContent className="p-8 text-center text-muted-foreground">
              No teams match that search.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

const TeamCard = ({ team }: { team: GtecTeam }) => {
  return (
    <Link to={`/teams/${team.id}`}>
      <Card className="team-card h-full hover:border-primary/50 transition-colors">
        <CardContent className="p-5 flex items-center gap-4">
          <div
            className="h-14 w-14 rounded-md flex-shrink-0 overflow-hidden border flex items-center justify-center"
            style={{ borderColor: team.color, backgroundColor: `${team.color}22` }}
          >
            {team.hasLogo ? (
              <img src={logoUrl(team.id)} alt={`${team.name} logo`} className="h-full w-full object-cover" />
            ) : (
              <Users className="h-5 w-5" style={{ color: team.color }} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="font-semibold truncate"
                style={team.official ? { color: "#3392FF" } : undefined}
              >
                {team.name}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  {team.official ? (
                    <Shield className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  ) : (
                    <ShieldQuestion className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                </TooltipTrigger>
                <TooltipContent>{team.official ? "Official team" : "Unofficial team"}</TooltipContent>
              </Tooltip>
              {team.isReigning && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Crown className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>Reigning champion</TooltipContent>
                </Tooltip>
              )}
              {team.isReturning && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <RotateCw className="h-3.5 w-3.5 text-sky-400 flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>Returning team from last season</TooltipContent>
                </Tooltip>
              )}
              {team.stars > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-0.5 text-xs text-yellow-400 flex-shrink-0 cursor-default">
                      <Star className="h-3 w-3 fill-current" />
                      {team.stars}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Past champion — {team.stars} season{team.stars === 1 ? "" : "s"} won
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {team.tag} · {team.members.length} member{team.members.length === 1 ? "" : "s"}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
