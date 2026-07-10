import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import championCrown from "@/assets/champion-crown.png";
import championStar from "@/assets/champion-star.png";
import rank1 from "@/assets/ranks/1_golden.png.asset.json";
import rank2 from "@/assets/ranks/2_silver.png.asset.json";
import rank3 from "@/assets/ranks/3_bronze.png.asset.json";
import rank4 from "@/assets/ranks/blue_4.png.asset.json";
import rank5 from "@/assets/ranks/blue_5.png.asset.json";
import rank6 from "@/assets/ranks/blue_6.png.asset.json";
import rank7 from "@/assets/ranks/blue_7.png.asset.json";
import rank8 from "@/assets/ranks/blue_8.png.asset.json";
import rank9 from "@/assets/ranks/blue_9.png.asset.json";
import rank10 from "@/assets/ranks/blue_10.png.asset.json";

const rankIcons = [rank1, rank2, rank3, rank4, rank5, rank6, rank7, rank8, rank9, rank10];

interface Team {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
}

interface OfficialTeamsProps {
  isAdmin: boolean;
}

export const OfficialTeams = ({ isAdmin }: OfficialTeamsProps) => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeam, setNewTeam] = useState({ name: "", emoji: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Team | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    const { data, error } = await supabase
      .from('official_teams')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading teams:', error);
      return;
    }

    if (data) {
      setTeams(data);
    }
  };

  const addTeam = async () => {
    if (!newTeam.name || !newTeam.emoji) {
      toast({
        title: "Error",
        description: "Please fill in name and emoji",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('official_teams')
      .insert([{
        name: newTeam.name,
        emoji: newTeam.emoji,
        description: newTeam.description || null
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add team: " + error.message,
        variant: "destructive"
      });
      return;
    }

    setNewTeam({ name: "", emoji: "", description: "" });
    await loadTeams();
    toast({
      title: "Success",
      description: "Team added successfully"
    });
  };

  const updateTeam = async () => {
    if (!editForm) return;

    const { error } = await supabase
      .from('official_teams')
      .update({
        name: editForm.name,
        emoji: editForm.emoji,
        description: editForm.description
      })
      .eq('id', editForm.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update team",
        variant: "destructive"
      });
      return;
    }

    setEditForm(null);
    setEditingId(null);
    await loadTeams();
    toast({
      title: "Success",
      description: "Team updated successfully"
    });
  };

  const deleteTeam = async (id: string) => {
    const { error } = await supabase
      .from('official_teams')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive"
      });
      return;
    }

    await loadTeams();
    toast({
      title: "Success",
      description: "Team removed"
    });
  };

  const startEdit = (team: Team) => {
    setEditForm(team);
    setEditingId(team.id);
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="hero-text">Official Teams</span>
          </h1>
        </div>

        {/* Admin Add Team */}
        {isAdmin && (
          <Card className="admin-panel mb-8 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Add New Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Team name"
                value={newTeam.name}
                onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
              />
              <Input
                placeholder="Emoji (e.g., 🔄)"
                value={newTeam.emoji}
                onChange={(e) => setNewTeam({...newTeam, emoji: e.target.value})}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newTeam.description}
                onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                rows={2}
              />
              <Button onClick={addTeam} className="w-full">
                Add Team
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Emoji Key */}
        <Card className="team-card mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Key</h2>
            <div className="flex flex-col items-center space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <img src={championCrown} alt="Crown" className="h-5 w-5 object-contain" />
                <span className="font-medium">= Reigning GTEC Champion</span>
                <span className="text-muted-foreground">— Teams that have recently won and are defending their crown.</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src={championStar} alt="Star" className="h-5 w-5 object-contain" />
                <span className="font-medium">= Past GTEC Champion</span>
                <span className="text-muted-foreground">— Teams that have won in previous seasons. (number of stars = number of seasons won)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🔄</span>
                <span className="font-medium">= Returning Team</span>
                <span className="text-muted-foreground">— Teams returning from last season competing again this season.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="team-card">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team, index) => (
                <div key={team.id}>
                  {editingId === team.id && editForm ? (
                    <Card className="p-4 space-y-3 bg-muted/20">
                      <Input
                        placeholder="Team name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      />
                      <Input
                        placeholder="Emoji"
                        value={editForm.emoji}
                        onChange={(e) => setEditForm({...editForm, emoji: e.target.value})}
                      />
                      <Textarea
                        placeholder="Description"
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={updateTeam} className="flex-1">Save</Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditForm(null); }} className="flex-1">Cancel</Button>
                      </div>
                    </Card>
                  ) : (
                    <div 
                      className="flex items-center space-x-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors animate-fade-in"
                      style={{animationDelay: `${index * 50}ms`}}
                    >
                      {rankIcons[index] && (
                        <img
                          src={rankIcons[index].url}
                          alt={`Rank ${index + 1}`}
                          className="h-8 w-8 object-contain flex-shrink-0"
                        />
                      )}
                      <span className="flex-1">{team.name}</span>
                      {team.emoji && (
                        <span className="flex items-center space-x-1">
                          {team.emoji.includes('crown') && (
                            <img src={championCrown} alt="Reigning Champion" className="h-5 w-5 object-contain" />
                          )}
                          {team.emoji.split(',').filter(e => e.trim() === 'star').map((_, i) => (
                            <img key={i} src={championStar} alt="Past Champion" className="h-5 w-5 object-contain" />
                          ))}
                          {(team.emoji.includes('returning') || team.emoji === '🔄') && (
                            <span className="text-lg">🔄</span>
                          )}
                        </span>
                      )}
                      {isAdmin && (
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(team)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteTeam(team.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};