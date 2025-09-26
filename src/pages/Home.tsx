import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Users, Calendar, Zap, Plus, Edit2, Trash2, Info, GamepadIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import gticLogo from "@/assets/gtic-logo.png";

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
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: "1",
      title: "Welcome to the official GTIC website!",
      content: "Welcome to the official GTIC website!",
      date: "2024-01-15",
      type: "news"
    }
  ]);

  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", type: "news" as const });
  const [editingId, setEditingId] = useState<string | null>(null);

  const addAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const announcement: Announcement = {
      id: Date.now().toString(),
      ...newAnnouncement,
      date: new Date().toISOString().split('T')[0]
    };

    setAnnouncements([announcement, ...announcements]);
    setNewAnnouncement({ title: "", content: "", type: "news" });
    toast({
      title: "Success",
      description: "Announcement added successfully"
    });
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
    toast({
      title: "Success", 
      description: "Announcement deleted"
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "tournament": return "bg-primary text-primary-foreground";
      case "update": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const stats = [
    { icon: Trophy, label: "Active Teams", value: "32", color: "text-primary" },
    { icon: Users, label: "Members", value: "400+", color: "text-secondary" },
    { icon: Calendar, label: "Seasons Played", value: "3", color: "text-primary" }
  ];

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center py-12 animate-fade-in">
          <div className="flex justify-center mb-6">
            <img src={gticLogo} alt="Gorilla Tag Intermediate COMP Logo" className="h-24 w-24 animate-float" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="hero-text">Gorilla Tag Intermediate COMP</span>
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
                What is Gorilla Tag Intermediate COMP?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                GTIC is a competitive Gorilla Tag league, focusing on Gorilla Tag and its one-of-a-kind movement system. GTIC unites players of all skills and is the hub for all competitive Gorilla Tag players.
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
                Watch or participate against the best Gorilla Tag teams in the GTIC tournament. For more info join the{" "}
                <a href="https://discord.gg/hB4V4ywqxj" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Discord
                </a>
                .
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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={getTypeColor(announcement.type)}>
                      {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{announcement.date}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(announcement.id)}>
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
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};