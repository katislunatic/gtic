import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Eye, MessageCircle, Zap, Plus, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Leak {
  id: string;
  title: string;
  content: string;
  type: "leak" | "rumor" | "teaser" | "speculation";
  credibility: "low" | "medium" | "high" | "confirmed";
  date: string;
  author: string;
  reactions: number;
  comments: number;
}

interface LeaksAndRumorsProps {
  isAdmin: boolean;
}

export const LeaksAndRumors = ({ isAdmin }: LeaksAndRumorsProps) => {
  const { toast } = useToast();
  const [leaks, setLeaks] = useState<Leak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaks();
  }, []);

  const fetchLeaks = async () => {
    try {
      const { data, error } = await supabase
        .from('leaks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedLeaks = data.map(leak => ({
        id: leak.id,
        title: leak.title,
        content: leak.content,
        type: leak.type as "leak" | "rumor" | "teaser" | "speculation",
        credibility: leak.credibility as "low" | "medium" | "high" | "confirmed",
        date: leak.created_at.split('T')[0],
        author: leak.author,
        reactions: leak.reactions,
        comments: leak.comments
      }));

      setLeaks(formattedLeaks);
    } catch (error) {
      console.error('Error fetching leaks:', error);
      toast({
        title: "Error",
        description: "Failed to load leaks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const [newLeak, setNewLeak] = useState({
    title: "",
    content: "",
    type: "rumor" as const,
    credibility: "low" as const
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const addLeak = async () => {
    if (!newLeak.title || !newLeak.content) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leaks')
        .insert([{
          title: newLeak.title,
          content: newLeak.content,
          type: newLeak.type,
          credibility: newLeak.credibility,
          author: "Admin",
          reactions: 0,
          comments: 0
        }])
        .select()
        .single();

      if (error) throw error;

      const formattedLeak: Leak = {
        id: data.id,
        title: data.title,
        content: data.content,
        type: data.type as "leak" | "rumor" | "teaser" | "speculation",
        credibility: data.credibility as "low" | "medium" | "high" | "confirmed",
        date: data.created_at.split('T')[0],
        author: data.author,
        reactions: data.reactions,
        comments: data.comments
      };

      setLeaks([formattedLeak, ...leaks]);
      setNewLeak({ title: "", content: "", type: "rumor", credibility: "low" });
      setShowAddForm(false);
      toast({
        title: "Success",
        description: "Leak/rumor posted successfully"
      });
    } catch (error) {
      console.error('Error adding leak:', error);
      toast({
        title: "Error",
        description: "Failed to post leak/rumor",
        variant: "destructive"
      });
    }
  };

  const deleteLeak = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leaks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLeaks(leaks.filter(l => l.id !== id));
      toast({
        title: "Success",
        description: "Post deleted"
      });
    } catch (error) {
      console.error('Error deleting leak:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive"
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "leak": return "bg-secondary text-secondary-foreground";
      case "teaser": return "bg-primary text-primary-foreground";
      case "rumor": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCredibilityColor = (credibility: string) => {
    switch (credibility) {
      case "confirmed": return "bg-green-500 text-white";
      case "high": return "bg-primary text-primary-foreground";
      case "medium": return "bg-yellow-500 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCredibilityIcon = (credibility: string) => {
    switch (credibility) {
      case "confirmed": return <Zap className="h-4 w-4" />;
      case "high": return <Eye className="h-4 w-4" />;
      case "medium": return <MessageCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leaks & rumors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center py-8 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Eye className="h-16 w-16 text-primary animate-float" />
              <div className="absolute -top-2 -right-2">
                <Zap className="h-8 w-8 text-secondary animate-glow" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="hero-text">Leaks & Rumors</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            The jungle telegraph - teasers, speculation, and insider information
          </p>
          <div className="flex justify-center">
            <Badge variant="outline" className="animate-glow">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Take everything with a grain of banana salt! 🍌
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-bounce-in">
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <Eye className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{leaks.length}</div>
              <div className="text-sm text-muted-foreground">Total Posts</div>
            </CardContent>
          </Card>
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <Zap className="h-6 w-6 mx-auto mb-2 text-secondary" />
              <div className="text-2xl font-bold">{leaks.filter(l => l.credibility === "confirmed").length}</div>
              <div className="text-sm text-muted-foreground">Confirmed</div>
            </CardContent>
          </Card>
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <MessageCircle className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{leaks.reduce((sum, l) => sum + l.reactions, 0)}</div>
              <div className="text-sm text-muted-foreground">Reactions</div>
            </CardContent>
          </Card>
          <Card className="team-card text-center">
            <CardContent className="p-4">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-secondary" />
              <div className="text-2xl font-bold">{leaks.filter(l => l.type === "rumor").length}</div>
              <div className="text-sm text-muted-foreground">Rumors</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Add Leak */}
        {isAdmin && (
          <Card className="admin-panel mb-8 animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Plus className="mr-2 h-5 w-5" />
                  Post New Leak/Rumor
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? "Cancel" : "New Post"}
                </Button>
              </div>
            </CardHeader>
            {showAddForm && (
              <CardContent className="space-y-4">
                <input
                  type="text"
                  placeholder="Post title (use emojis for impact! 🔥👑🚨)"
                  value={newLeak.title}
                  onChange={(e) => setNewLeak({...newLeak, title: e.target.value})}
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
                />
                <Textarea
                  placeholder="Post content - spill the tea! ☕"
                  value={newLeak.content}
                  onChange={(e) => setNewLeak({...newLeak, content: e.target.value})}
                  rows={4}
                />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={newLeak.type}
                    onChange={(e) => setNewLeak({...newLeak, type: e.target.value as any})}
                    className="p-3 rounded-lg bg-input border border-border text-foreground"
                  >
                    <option value="rumor">Rumor</option>
                    <option value="leak">Leak</option>
                    <option value="teaser">Official Teaser</option>
                    <option value="speculation">Speculation</option>
                  </select>
                  <select
                    value={newLeak.credibility}
                    onChange={(e) => setNewLeak({...newLeak, credibility: e.target.value as any})}
                    className="p-3 rounded-lg bg-input border border-border text-foreground"
                  >
                    <option value="low">Low Credibility</option>
                    <option value="medium">Medium Credibility</option>
                    <option value="high">High Credibility</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </div>
                <Button onClick={addLeak} className="w-full">
                  Post to Community
                </Button>
              </CardContent>
            )}
          </Card>
        )}

        {/* Leaks & Rumors Feed */}
        <div className="space-y-6">
          {leaks.map((leak, index) => (
            <Card key={leak.id} className="team-card animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={getTypeColor(leak.type)}>
                      {leak.type.charAt(0).toUpperCase() + leak.type.slice(1)}
                    </Badge>
                    <Badge className={getCredibilityColor(leak.credibility)}>
                      {getCredibilityIcon(leak.credibility)}
                      <span className="ml-1">{leak.credibility.charAt(0).toUpperCase() + leak.credibility.slice(1)}</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">{leak.date}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteLeak(leak.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardTitle className="text-xl">{leak.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{leak.content}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>by {leak.author}</span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{leak.reactions}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{leak.comments}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Disclaimer */}
        <Card className="mt-8 animate-fade-in bg-muted/20 border-2 border-dashed border-muted">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2">Community Disclaimer</h3>
            <p className="text-muted-foreground">
              This section contains unverified information, speculation, and community-generated content. 
              Always wait for official announcements from GTIC staff for confirmed information. 
              Swing responsibly! 🐒
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};