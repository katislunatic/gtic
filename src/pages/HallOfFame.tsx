import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Crown, Award, Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Champion {
  id: string;
  season: string;
  teamName: string;
  captain: string;
  members: string[];
  finalScore: string;
  mvp: string;
  mvpStats: string;
  date: string;
  specialNotes?: string;
}

interface HallOfFameProps {
  isAdmin: boolean;
}

export const HallOfFame = ({ isAdmin }: HallOfFameProps) => {
  const { toast } = useToast();
  const [champions, setChampions] = useState<Champion[]>([
    {
      id: "1",
      season: "Season 1",
      teamName: "Jungle Legends",
      captain: "TreeKing99",
      members: ["BranchMaster", "VineSwinger", "LeafDancer"],
      finalScore: "3-1",
      mvp: "TreeKing99",
      mvpStats: "15 wins, 2 losses, 85% accuracy",
      date: "2023-12-15",
      specialNotes: "First ever GTIC champions! Set the standard for competitive Gorilla Tag."
    },
    {
      id: "2", 
      season: "Season 2",
      teamName: "Tree Hoppers",
      captain: "MonkeyMaster",
      members: ["BranchSwinger", "LeafDancer", "VineRider"],
      finalScore: "3-2",
      mvp: "BranchSwinger",
      mvpStats: "18 wins, 3 losses, 90% accuracy",
      date: "2023-12-30",
      specialNotes: "Epic comeback from 0-2 down in the finals. Most thrilling championship match yet!"
    }
  ]);

  const [newChampion, setNewChampion] = useState({
    season: "",
    teamName: "",
    captain: "",
    members: ["", "", ""],
    finalScore: "",
    mvp: "",
    mvpStats: "",
    specialNotes: ""
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const addChampion = () => {
    if (!newChampion.season || !newChampion.teamName || !newChampion.captain || !newChampion.mvp) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    const champion: Champion = {
      id: Date.now().toString(),
      ...newChampion,
      date: new Date().toISOString().split('T')[0]
    };

    setChampions([champion, ...champions]);
    setNewChampion({
      season: "",
      teamName: "",
      captain: "",
      members: ["", "", ""],
      finalScore: "",
      mvp: "",
      mvpStats: "",
      specialNotes: ""
    });
    setShowAddForm(false);
    toast({
      title: "Success",
      description: "Champion added to Hall of Fame"
    });
  };

  const deleteChampion = (id: string) => {
    setChampions(champions.filter(c => c.id !== id));
    toast({
      title: "Success",
      description: "Champion removed from Hall of Fame"
    });
  };

  const getSeasonIcon = (season: string) => {
    if (season.includes("1")) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (season.includes("2")) return <Trophy className="h-6 w-6 text-primary" />;
    return <Award className="h-6 w-6 text-secondary" />;
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center py-8 animate-fade-in">
          <div className="flex justify-center mb-6">
            <Trophy className="h-16 w-16 text-primary animate-float" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="hero-text">Hall of Fame</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Honoring the legendary gorillas who swung to victory
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-bounce-in">
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <Crown className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{champions.length}</div>
              <div className="text-sm text-muted-foreground">Champions</div>
            </CardContent>
          </Card>
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{champions.length}</div>
              <div className="text-sm text-muted-foreground">Seasons</div>
            </CardContent>
          </Card>
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <Star className="h-6 w-6 mx-auto mb-2 text-secondary" />
              <div className="text-2xl font-bold">{champions.length}</div>
              <div className="text-sm text-muted-foreground">MVPs</div>
            </CardContent>
          </Card>
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <Award className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{champions.reduce((sum, c) => sum + c.members.filter(m => m).length + 1, 0)}</div>
              <div className="text-sm text-muted-foreground">Hall of Famers</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Add Champion */}
        {isAdmin && (
          <Card className="admin-panel mb-8 animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Plus className="mr-2 h-5 w-5" />
                  Add New Champion
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? "Cancel" : "Add Champion"}
                </Button>
              </div>
            </CardHeader>
            {showAddForm && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Season (e.g., Season 3)"
                    value={newChampion.season}
                    onChange={(e) => setNewChampion({...newChampion, season: e.target.value})}
                    className="p-3 rounded-lg bg-input border border-border text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Team name"
                    value={newChampion.teamName}
                    onChange={(e) => setNewChampion({...newChampion, teamName: e.target.value})}
                    className="p-3 rounded-lg bg-input border border-border text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Captain name"
                    value={newChampion.captain}
                    onChange={(e) => setNewChampion({...newChampion, captain: e.target.value})}
                    className="p-3 rounded-lg bg-input border border-border text-foreground"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {newChampion.members.map((member, index) => (
                    <input
                      key={index}
                      type="text"
                      placeholder={`Member ${index + 1}`}
                      value={member}
                      onChange={(e) => {
                        const members = [...newChampion.members];
                        members[index] = e.target.value;
                        setNewChampion({...newChampion, members});
                      }}
                      className="p-3 rounded-lg bg-input border border-border text-foreground"
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Final score (e.g., 3-1)"
                    value={newChampion.finalScore}
                    onChange={(e) => setNewChampion({...newChampion, finalScore: e.target.value})}
                    className="p-3 rounded-lg bg-input border border-border text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="MVP name"
                    value={newChampion.mvp}
                    onChange={(e) => setNewChampion({...newChampion, mvp: e.target.value})}
                    className="p-3 rounded-lg bg-input border border-border text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="MVP stats"
                    value={newChampion.mvpStats}
                    onChange={(e) => setNewChampion({...newChampion, mvpStats: e.target.value})}
                    className="p-3 rounded-lg bg-input border border-border text-foreground"
                  />
                </div>
                <textarea
                  placeholder="Special notes (optional)"
                  value={newChampion.specialNotes}
                  onChange={(e) => setNewChampion({...newChampion, specialNotes: e.target.value})}
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
                  rows={3}
                />
                <Button onClick={addChampion} className="w-full">
                  Add to Hall of Fame
                </Button>
              </CardContent>
            )}
          </Card>
        )}

        {/* Champions */}
        <div className="space-y-8">
          {champions.map((champion, index) => (
            <Card key={champion.id} className="team-card animate-fade-in glow-primary" style={{animationDelay: `${index * 200}ms`}}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getSeasonIcon(champion.season)}
                    <div>
                      <CardTitle className="text-2xl hero-text">{champion.season} Champions</CardTitle>
                      <div className="text-lg font-semibold text-primary">{champion.teamName}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {champion.finalScore}
                    </Badge>
                    {isAdmin && (
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteChampion(champion.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Team Info */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <Crown className="h-5 w-5 mr-2 text-primary" />
                        Championship Team
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-sm text-muted-foreground">Captain</span>
                          <span className="font-medium text-primary">{champion.captain}</span>
                        </div>
                        {champion.members.filter(m => m).map((member, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                            <span className="text-sm text-muted-foreground">Member {idx + 1}</span>
                            <span className="font-medium">{member}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* MVP Info */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <Star className="h-5 w-5 mr-2 text-secondary" />
                        Season MVP
                      </h3>
                      <div className="p-4 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/20">
                        <div className="text-xl font-bold text-secondary mb-2">{champion.mvp}</div>
                        <div className="text-sm text-muted-foreground">{champion.mvpStats}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Special Notes */}
                {champion.specialNotes && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="font-semibold text-primary mb-2">Championship Highlights</h4>
                    <p className="text-muted-foreground">{champion.specialNotes}</p>
                  </div>
                )}

                {/* Date */}
                <div className="text-center text-sm text-muted-foreground border-t border-border pt-4">
                  Crowned on {new Date(champion.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Future Champions Placeholder */}
        <Card className="team-card mt-8 animate-fade-in text-center">
          <CardContent className="p-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2 text-muted-foreground">Season 3 Champion</h3>
            <p className="text-muted-foreground">The battle is ongoing... Who will claim the crown?</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};