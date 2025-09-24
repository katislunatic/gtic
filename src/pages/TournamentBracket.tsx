import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trophy, Users, Calendar } from "lucide-react";

interface Match {
  id: string;
  team1: string;
  team2: string;
  score1: number | null;
  score2: number | null;
  round: string;
  status: "upcoming" | "live" | "completed";
  winner?: string;
}

interface TournamentBracketProps {
  isAdmin: boolean;
}

export const TournamentBracket = ({ isAdmin }: TournamentBracketProps) => {
  const [matches, setMatches] = useState<Match[]>([
    // Round 1
    { id: "1", team1: "Tree Hoppers", team2: "Branch Breakers", score1: 3, score2: 1, round: "Round 1", status: "completed", winner: "Tree Hoppers" },
    { id: "2", team1: "Jungle Kings", team2: "Vine Swingers", score1: 2, score2: 1, round: "Round 1", status: "completed", winner: "Jungle Kings" },
    { id: "3", team1: "Canopy Crusaders", team2: "Leaf Legends", score1: null, score2: null, round: "Round 1", status: "live" },
    { id: "4", team1: "Banana Bandits", team2: "Grove Guardians", score1: null, score2: null, round: "Round 1", status: "upcoming" },
    
    // Semi Finals
    { id: "5", team1: "Tree Hoppers", team2: "Jungle Kings", score1: null, score2: null, round: "Semi Finals", status: "upcoming" },
    { id: "6", team1: "TBD", team2: "TBD", score1: null, score2: null, round: "Semi Finals", status: "upcoming" },
    
    // Finals
    { id: "7", team1: "TBD", team2: "TBD", score1: null, score2: null, round: "Finals", status: "upcoming" },
  ]);

  const updateScore = (matchId: string, team: 1 | 2, score: number) => {
    setMatches(matches.map(match => {
      if (match.id === matchId) {
        const updated = { ...match };
        if (team === 1) updated.score1 = score;
        else updated.score2 = score;
        
        // Determine winner if both scores are set
        if (updated.score1 !== null && updated.score2 !== null) {
          updated.winner = updated.score1 > updated.score2 ? updated.team1 : updated.team2;
          updated.status = "completed";
        }
        
        return updated;
      }
      return match;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live": return "bg-secondary text-secondary-foreground animate-glow";
      case "completed": return "bg-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const tournamentInfo = {
    season: "Season 3",
    startDate: "January 15, 2024",
    totalTeams: 32,
    currentRound: "Round 1",
    nextMatch: "Today at 7:00 PM EST",
  };

  const roundMatches = (round: string) => matches.filter(m => m.round === round);

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center py-8 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="hero-text">Tournament Bracket</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Track the epic battles as teams swing their way to victory
          </p>
        </div>

        {/* Tournament Info */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 animate-bounce-in">
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">{tournamentInfo.season}</div>
            </CardContent>
          </Card>
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-secondary" />
              <div className="text-sm">{tournamentInfo.startDate}</div>
            </CardContent>
          </Card>
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">{tournamentInfo.totalTeams} Teams</div>
            </CardContent>
          </Card>
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Current Round</div>
              <div className="font-bold">{tournamentInfo.currentRound}</div>
            </CardContent>
          </Card>
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Next Match</div>
              <div className="text-sm font-bold">{tournamentInfo.nextMatch}</div>
            </CardContent>
          </Card>
        </div>

        {/* Bracket */}
        <div className="space-y-8">
          {/* Round 1 */}
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-center">Round 1</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roundMatches("Round 1").map((match) => (
                <Card key={match.id} className="tournament-bracket">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(match.status)}>
                        {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                      </Badge>
                      {isAdmin && (
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className={`font-medium ${match.winner === match.team1 ? 'text-primary' : ''}`}>
                          {match.team1}
                        </span>
                        <span className="text-2xl font-bold">
                          {isAdmin && match.status !== "completed" ? (
                            <input
                              type="number"
                              min="0"
                              className="w-12 text-center bg-transparent border-b border-border"
                              value={match.score1 || ""}
                              onChange={(e) => updateScore(match.id, 1, parseInt(e.target.value) || 0)}
                            />
                          ) : (
                            match.score1 ?? "-"
                          )}
                        </span>
                      </div>
                      <div className="text-center text-sm text-muted-foreground">VS</div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className={`font-medium ${match.winner === match.team2 ? 'text-primary' : ''}`}>
                          {match.team2}
                        </span>
                        <span className="text-2xl font-bold">
                          {isAdmin && match.status !== "completed" ? (
                            <input
                              type="number"
                              min="0"
                              className="w-12 text-center bg-transparent border-b border-border"
                              value={match.score2 || ""}
                              onChange={(e) => updateScore(match.id, 2, parseInt(e.target.value) || 0)}
                            />
                          ) : (
                            match.score2 ?? "-"
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Semi Finals */}
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-center">Semi Finals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {roundMatches("Semi Finals").map((match) => (
                <Card key={match.id} className="tournament-bracket">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(match.status)}>
                        {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                      </Badge>
                      {isAdmin && (
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className={`font-medium ${match.winner === match.team1 ? 'text-primary' : ''}`}>
                          {match.team1}
                        </span>
                        <span className="text-2xl font-bold">{match.score1 ?? "-"}</span>
                      </div>
                      <div className="text-center text-sm text-muted-foreground">VS</div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className={`font-medium ${match.winner === match.team2 ? 'text-primary' : ''}`}>
                          {match.team2}
                        </span>
                        <span className="text-2xl font-bold">{match.score2 ?? "-"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Finals */}
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 text-center">
              <span className="hero-text">Finals</span>
            </h2>
            <div className="max-w-md mx-auto">
              {roundMatches("Finals").map((match) => (
                <Card key={match.id} className="tournament-bracket glow-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(match.status)}>
                        {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                      </Badge>
                      {isAdmin && (
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <span className={`font-medium text-lg ${match.winner === match.team1 ? 'text-primary' : ''}`}>
                          {match.team1}
                        </span>
                        <span className="text-3xl font-bold">{match.score1 ?? "-"}</span>
                      </div>
                      <div className="text-center text-lg font-bold hero-text">CHAMPIONSHIP</div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <span className={`font-medium text-lg ${match.winner === match.team2 ? 'text-primary' : ''}`}>
                          {match.team2}
                        </span>
                        <span className="text-3xl font-bold">{match.score2 ?? "-"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};