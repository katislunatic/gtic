import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Users, Trophy, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Team {
  id: string;
  name: string;
  captain: string;
  members: string[];
  wins: number;
  losses: number;
  region: string;
  logo?: string;
  founded: string;
}

interface OfficialTeamsProps {
  isAdmin: boolean;
}

export const OfficialTeams = ({ isAdmin }: OfficialTeamsProps) => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTeam, setNewTeam] = useState({
    name: "",
    captain: "",
    members: ["", "", ""],
    region: "North America"
  });

  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTeams = data.map(team => ({
        id: team.id,
        name: team.name,
        captain: team.captain,
        members: team.members,
        wins: team.wins,
        losses: team.losses,
        region: team.region,
        logo: team.logo,
        founded: team.founded || team.created_at.split('T')[0]
      }));

      setTeams(formattedTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Error",
        description: "Failed to load teams",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTeam = async () => {
    if (!newTeam.name || !newTeam.captain || newTeam.members.some(m => !m)) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{
          name: newTeam.name,
          captain: newTeam.captain,
          members: newTeam.members,
          wins: 0,
          losses: 0,
          region: newTeam.region,
          founded: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) throw error;

      const newFormattedTeam: Team = {
        id: data.id,
        name: data.name,
        captain: data.captain,
        members: data.members,
        wins: data.wins,
        losses: data.losses,
        region: data.region,
        logo: data.logo,
        founded: data.founded
      };

      setTeams([newFormattedTeam, ...teams]);
      setNewTeam({ name: "", captain: "", members: ["", "", ""], region: "North America" });
      setShowAddForm(false);
      toast({
        title: "Success",
        description: "Team added successfully"
      });
    } catch (error) {
      console.error('Error adding team:', error);
      toast({
        title: "Error",
        description: "Failed to add team",
        variant: "destructive"
      });
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTeams(teams.filter(t => t.id !== id));
      toast({
        title: "Success",
        description: "Team removed"
      });
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive"
      });
    }
  };

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    return total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
  };

  const getRegionColor = (region: string) => {
    const colors = {
      "North America": "bg-primary text-primary-foreground",
      "Europe": "bg-secondary text-secondary-foreground",
      "Asia": "bg-accent text-accent-foreground",
      "South America": "bg-muted text-muted-foreground"
    };
    return colors[region as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  const sortedTeams = [...teams].sort((a, b) => {
    const aWinRate = parseFloat(getWinRate(a.wins, a.losses));
    const bWinRate = parseFloat(getWinRate(b.wins, b.losses));
    return bWinRate - aWinRate;
  });

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading teams...</p>
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
            <span className="hero-text">Official Teams</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Meet the elite gorillas competing in GTIC Season 3
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-bounce-in">
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{teams.length}</div>
              <div className="text-sm text-muted-foreground">Total Teams</div>
            </CardContent>
          </Card>
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-secondary" />
              <div className="text-2xl font-bold">{teams.reduce((sum, t) => sum + t.wins, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Wins</div>
            </CardContent>
          </Card>
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <Star className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{Math.max(...teams.map(t => t.wins))}</div>
              <div className="text-sm text-muted-foreground">Best Record</div>
            </CardContent>
          </Card>
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <Users className="h-6 w-6 mx-auto mb-2 text-secondary" />
              <div className="text-2xl font-bold">{teams.length * 4}</div>
              <div className="text-sm text-muted-foreground">Total Players</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Add Team */}
        {isAdmin && (
          <Card className="admin-panel mb-8 animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Plus className="mr-2 h-5 w-5" />
                  Add New Team
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? "Cancel" : "Add Team"}
                </Button>
              </div>
            </CardHeader>
            {showAddForm && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Team name"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                    className="p-3 rounded-lg bg-input border border-border text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Captain name"
                    value={newTeam.captain}
                    onChange={(e) => setNewTeam({...newTeam, captain: e.target.value})}
                    className="p-3 rounded-lg bg-input border border-border text-foreground"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {newTeam.members.map((member, index) => (
                    <input
                      key={index}
                      type="text"
                      placeholder={`Member ${index + 1}`}
                      value={member}
                      onChange={(e) => {
                        const members = [...newTeam.members];
                        members[index] = e.target.value;
                        setNewTeam({...newTeam, members});
                      }}
                      className="p-3 rounded-lg bg-input border border-border text-foreground"
                    />
                  ))}
                </div>
                <select
                  value={newTeam.region}
                  onChange={(e) => setNewTeam({...newTeam, region: e.target.value})}
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
                >
                  <option value="North America">North America</option>
                  <option value="Europe">Europe</option>
                  <option value="Asia">Asia</option>
                  <option value="South America">South America</option>
                </select>
                <Button onClick={addTeam} className="w-full">
                  Add Team
                </Button>
              </CardContent>
            )}
          </Card>
        )}

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTeams.map((team, index) => (
            <Card key={team.id} className="team-card animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <span className="text-xl font-bold text-white">
                        {team.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <Badge className={getRegionColor(team.region)} variant="secondary">
                        {team.region}
                      </Badge>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteTeam(team.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Captain */}
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Captain</div>
                  <div className="font-medium text-primary">{team.captain}</div>
                </div>

                {/* Members */}
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Team Members</div>
                  <div className="grid grid-cols-1 gap-1">
                    {team.members.map((member, idx) => (
                      <div key={idx} className="text-sm bg-muted/50 rounded px-2 py-1">
                        {member}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{team.wins}</div>
                    <div className="text-xs text-muted-foreground">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-secondary">{team.losses}</div>
                    <div className="text-xs text-muted-foreground">Losses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{getWinRate(team.wins, team.losses)}%</div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                </div>

                {/* Founded */}
                <div className="text-xs text-muted-foreground text-center">
                  Founded: {new Date(team.founded).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};