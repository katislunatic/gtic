import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { Shield, ShieldQuestion, Users, Loader2 } from "lucide-react";
import { searchPlayers, type PlayerDirectoryEntry } from "@/lib/gtecApi";

type StatusFilter = "all" | "official" | "unofficial" | "none";

const PAGE_SIZE = 30;

export const Players = () => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["gtec-players", search, status, offset],
    queryFn: () => searchPlayers({ search, status, limit: PAGE_SIZE, offset }),
    staleTime: 30_000,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setSearch(searchInput.trim());
  };

  const players = data?.players ?? [];
  const total = data?.total ?? 0;
  const hasMore = offset + players.length < total;

  return (
    <div className="min-h-screen pt-28 md:pt-36 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="hero-text">Players</span>
          </h1>
          <p className="text-muted-foreground">Look up anyone in the server.</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 mb-6 max-w-xl mx-auto">
          <Input
            placeholder="Search by username or display name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" size="sm">Search</Button>
        </form>

        <div className="flex gap-2 justify-center mb-10 flex-wrap">
          {([
            ["all", "All"],
            ["official", "On Official Team"],
            ["unofficial", "On Unofficial Team"],
            ["none", "No Team"],
          ] as [StatusFilter, string][]).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={status === value ? "default" : "outline"}
              onClick={() => {
                setStatus(value);
                setOffset(0);
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-muted/20 animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <Card className="team-card">
            <CardContent className="p-8 text-center text-muted-foreground">
              Couldn't reach the player directory right now. Try again in a moment.
            </CardContent>
          </Card>
        ) : players.length === 0 ? (
          <Card className="team-card">
            <CardContent className="p-8 text-center text-muted-foreground">
              No players match that search.
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">{total.toLocaleString()} player{total === 1 ? "" : "s"} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((p) => (
                <PlayerCard key={p.discordUserId} player={p} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button variant="outline" onClick={() => setOffset(offset + PAGE_SIZE)} disabled={isFetching}>
                  {isFetching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

const PlayerCard = ({ player }: { player: PlayerDirectoryEntry }) => {
  return (
    <Link to={`/players/${player.discordUserId}`}>
      <Card className="team-card h-full hover:border-primary/50 transition-colors">
        <CardContent className="p-4 flex items-center gap-3">
          <img
            src={player.identity.avatarUrl}
            alt={player.identity.displayName}
            className="h-10 w-10 rounded-full flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="font-medium truncate">{player.identity.displayName}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              {player.teamStatus === "official" && (
                <>
                  <Shield className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="truncate" style={{ color: "#3392FF" }}>{player.teamName}</span>
                </>
              )}
              {player.teamStatus === "unofficial" && (
                <>
                  <ShieldQuestion className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{player.teamName}</span>
                </>
              )}
              {player.teamStatus === "none" && (
                <>
                  <Users className="h-3 w-3 flex-shrink-0" />
                  <span>No team</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
