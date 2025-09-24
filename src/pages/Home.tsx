import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Users, Calendar, Zap, Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
      title: "Season 3 Tournament Begins!",
      content: "The third season of GTIC is officially underway! 32 teams have registered and brackets are now live. May the best gorillas win!",
      date: "2024-01-15",
      type: "tournament"
    },
    {
      id: "2", 
      title: "New Team Registration Rules",
      content: "Updated registration requirements now include team logo submission and captain verification. Check the teams page for details.",
      date: "2024-01-10",
      type: "update"
    },
    {
      id: "3",
      title: "Hall of Fame Updated",
      content: "Season 2 champions Tree Hoppers have been added to our Hall of Fame! Congratulations on an amazing run.",
      date: "2024-01-05",
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
          <Button size="lg" className="glow-primary">
            <Trophy className="mr-2 h-5 w-5" />
            Join the Competition
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-bounce-in">
          {stats.map((stat, index) => (
            <Card key={index} className="team-card text-center">
              <CardContent className="p-6">
                <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
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
          <h2 className="text-3xl font-bold text-center mb-8">Latest Announcements</h2>
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
    </div>
  );
};