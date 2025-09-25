import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trophy, Users, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMatches = data.map(match => ({
        id: match.id,
        team1: match.team1,
        team2: match.team2,
        score1: match.team1_score,
        score2: match.team2_score,
        round: match.round,
        status: match.status as "upcoming" | "live" | "completed",
        winner: match.winner
      }));

      setMatches(formattedMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error",
        description: "Failed to load matches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateScore = async (matchId: string, team: 1 | 2, score: number) => {
    try {
      // Find the current match to get both scores
      const currentMatch = matches.find(m => m.id === matchId);
      if (!currentMatch) return;

      const team1Score = team === 1 ? score : currentMatch.score1;
      const team2Score = team === 2 ? score : currentMatch.score2;
      
      let winner = null;
      let status = currentMatch.status;
      
      // Determine winner if both scores are set
      if (team1Score !== null && team2Score !== null) {
        winner = team1Score > team2Score ? currentMatch.team1 : currentMatch.team2;
        status = "completed";
      }

      const { error } = await supabase
        .from('matches')
        .update({
          team1_score: team1Score,
          team2_score: team2Score,
          winner,
          status
        })
        .eq('id', matchId);

      if (error) throw error;

      // Update local state
      setMatches(matches.map(match => {
        if (match.id === matchId) {
          return {
            ...match,
            score1: team1Score,
            score2: team2Score,
            winner,
            status: status as "upcoming" | "live" | "completed"
          };
        }
        return match;
      }));

      toast({
        title: "Success",
        description: "Match updated successfully"
      });
    } catch (error) {
      console.error('Error updating match:', error);
      toast({
        title: "Error",
        description: "Failed to update match",
        variant: "destructive"
      });
    }
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

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tournament bracket...</p>
        </div>
      </div>
    );
  }

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