import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Users, Calendar, Zap, Plus, Edit2, Trash2, Info, GamepadIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import gticLogo from "@/assets/gtec-logo.png";
import { supabase } from "@/integrations/supabase/client";

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: "news" | "tournament" | "update";
}

interface HomeProps {
  isAdmin: boolean;
}

export const Home = ({ isAdmin }: HomeProps) => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", type: "news" as const });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Announcement | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading announcements:', error);
      return;
    }

    if (data) {
      setAnnouncements(data.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        date: a.date,
        type: a.type as "news" | "tournament" | "update"
      })));
    }
  };

  const addAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('announcements')
      .insert([{
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        type: newAnnouncement.type,
        date: new Date().toISOString().split('T')[0]
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add announcement: " + error.message,
        variant: "destructive"
      });
      return;
    }

    setNewAnnouncement({ title: "", content: "", type: "news" });
    await loadAnnouncements();
    toast({
      title: "Success",
      description: "Announcement added successfully"
    });
  };

  const updateAnnouncement = async () => {
    if (!editForm) return;

    const { error } = await supabase
      .from('announcements')
      .update({
        title: editForm.title,
        content: editForm.content,
        type: editForm.type
      })
      .eq('id', editForm.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive"
      });
      return;
    }

    setEditForm(null);
    setEditingId(null);
    await loadAnnouncements();
    toast({
      title: "Success",
      description: "Announcement updated successfully"
    });
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive"
      });
      return;
    }

    await loadAnnouncements();
    toast({
      title: "Success", 
      description: "Announcement deleted"
    });
  };

  const startEdit = (announcement: Announcement) => {
    setEditForm(announcement);
    setEditingId(announcement.id);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "tournament": return "bg-primary text-primary-foreground";
      case "update": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const stats = [
    { icon: Trophy, label: "Active Teams", value: "16", color: "text-primary" },
    { icon: Users, label: "Members", value: "1000+", color: "text-secondary" },
    { icon: Calendar, label: "Current Season", value: "3R", color: "text-primary" }
  ];

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center py-12 animate-fade-in">
          <div className="flex justify-center mb-6">
            <img src={gticLogo} alt="Gorilla Tag Elite COMP Logo" className="h-64 w-64 animate-float" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="hero-text">Gorilla Tag Elite COMP</span>
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 text-muted-foreground">
            Unleash Your Inner Gorilla.
          </p>
          <Button size="lg" className="glow-primary" asChild>
            <a href="https://discord.gg/hB4V4ywqxj" target="_blank" rel="noopener noreferrer">
              <Trophy className="mr-2 h-5 w-5" />
              Join the Competition
            </a>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="flex flex-wrap justify-center gap-4 mb-12 animate-bounce-in">
          {stats.map((stat, index) => (
            <Card key={index} className="team-card text-center w-48">
              <CardContent className="p-6">
                <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Sections */}
        <div className="space-y-8 mb-12">
          <Card className="team-card animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" />
                What is Gorilla Tag Elite COMP?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                GTEC is a competitive Gorilla Tag league, focusing on Gorilla Tag and its one-of-a-kind movement system. GTEC unites players of all skills and is the hub for all competitive Gorilla Tag players.
              </p>
            </CardContent>
          </Card>

          <Card className="team-card animate-fade-in" style={{animationDelay: '100ms'}}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GamepadIcon className="mr-2 h-5 w-5 text-secondary" />
                Tournament
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Watch or participate against the best Gorilla Tag teams in the GTEC tournament. For more info join the{" "}
                <a href="https://discord.gg/hB4V4ywqxj" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Discord
                </a>
                .
              </p>
            </CardContent>
          </Card>

          <Card className="team-card animate-fade-in" style={{animationDelay: '200ms'}}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5 text-primary" />
                Introducing Season 3R — Revived. Restarted. Ready.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                GTEC is returning with a rebuilt Season 3, now called Season 3R. The "R" stands for Revived / Restart, representing a clean slate for the league. With mostly all-new teams, a refreshed structure, and a renewed commitment to competition, this season marks the official reboot of GTEC.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Add Announcement */}
        {isAdmin && (
          <Card className="admin-panel mb-8 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Add New Announcement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                placeholder="Announcement title"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
              />
              <Textarea
                placeholder="Announcement content"
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                rows={3}
              />
              <select
                value={newAnnouncement.type}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, type: e.target.value as any})}
                className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
              >
                <option value="news">News</option>
                <option value="tournament">Tournament</option>
                <option value="update">Update</option>
              </select>
              <Button onClick={addAnnouncement} className="w-full">
                Add Announcement
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Announcements */}
        <div className="space-y-6">
          {announcements.map((announcement, index) => (
            <Card key={announcement.id} className="team-card animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
              {editingId === announcement.id && editForm ? (
                <CardContent className="p-6 space-y-4">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
                  />
                  <Textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                    rows={3}
                  />
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({...editForm, type: e.target.value as any})}
                    className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
                  >
                    <option value="news">News</option>
                    <option value="tournament">Tournament</option>
                    <option value="update">Update</option>
                  </select>
                  <div className="flex space-x-2">
                    <Button onClick={updateAnnouncement} className="flex-1">Save</Button>
                    <Button variant="outline" onClick={() => { setEditingId(null); setEditForm(null); }} className="flex-1">Cancel</Button>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={getTypeColor(announcement.type)}>
                          {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                        </Badge>
                      </div>
                      {isAdmin && (
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(announcement)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteAnnouncement(announcement.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <CardTitle>{announcement.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{announcement.content}</p>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};