import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Users, Calendar, Zap, TrendingUp, Plus, Edit2, Trash2, Info, GamepadIcon, ExternalLink, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import { LoadingDots } from "@/components/LoadingDots";
import { LiveStreamBanner } from "@/components/LiveStreamBanner";
import { useTranslation } from "react-i18next";
import gticLogo from "@/assets/gtic-logo.png";
import apexinnoLogo from "@/assets/gtec-x-apexinno.png";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";

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
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", type: "news" as const });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Announcement | null>(null);
  const [memberCount, setMemberCount] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<string | null>(null);
  const [countsLoaded, setCountsLoaded] = useState(false);
  const { settings, saveSettings } = useSiteSettings();
  const [statsForm, setStatsForm] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      const { data, error } = await supabase.functions.invoke('discord-member-count');
      if (!cancelled && !error && data?.member_count) {
        setMemberCount(Number(data.member_count).toLocaleString());
      } else if (!cancelled && memberCount === null) {
        // Fetch failed and we have nothing yet — fall back to the last known figure
        setMemberCount("2,500+");
      }
      if (!cancelled && !error && data?.presence_count != null) {
        setOnlineCount(Number(data.presence_count).toLocaleString());
      }
      if (!cancelled) setCountsLoaded(true);
    };
    fetchCount();
    const id = setInterval(fetchCount, 60_000);
    return () => { cancelled = true; clearInterval(id); };
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
    { icon: Trophy, label: t("home.statTeams"), value: settings.teams_count || "26", color: "text-primary" },
    {
      icon: Users,
      label: t("home.statMembers"),
      value: memberCount ?? <LoadingDots label="Loading" />,
      color: "text-secondary",
      sub: onlineCount ? `${onlineCount} ${t("home.statOnline")}` : !countsLoaded ? <LoadingDots label="Loading" /> : undefined
    },
    { icon: Calendar, label: t("home.statSeason"), value: settings.season || "4", color: "text-primary" },
    { icon: Zap, label: settings.stage_label || "Elimination", value: settings.stage_value || "Round 2", color: "text-secondary" },
    { icon: TrendingUp, label: t("home.statRank"), value: settings.rank_value || "#5", color: "text-primary" }
  ];

  const saveStats = async () => {
    if (!statsForm) return;
    const error = await saveSettings(statsForm);
    if (error) {
      toast({ title: "Error", description: "Failed to save stats", variant: "destructive" });
      return;
    }
    setStatsForm(null);
    toast({ title: "Success", description: "Homepage stats updated" });
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="relative text-center pt-20 pb-12 animate-fade-in overflow-hidden">
          <div className="relative flex justify-center mb-6 animate-float">
            {/* Two soft glow blobs echoing the logo's blue/red split — each
                fades to transparent on its own rather than meeting the other
                at a hard seam, and they live inside the same floating
                wrapper as the logo so they bob up and down together. Extra
                top padding above (pt-20 instead of py-12) keeps the blobs
                from poking past the container's top edge, where overflow-
                hidden would otherwise clip them into a visible flat line. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-[70%] -translate-y-1/2 rounded-full opacity-25 blur-2xl"
              style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, hsl(var(--primary)) 35%, transparent 75%)" }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-[30%] -translate-y-1/2 rounded-full opacity-25 blur-2xl"
              style={{ background: "radial-gradient(circle, hsl(var(--secondary)) 0%, hsl(var(--secondary)) 35%, transparent 75%)" }}
            />
            <img src={gticLogo} alt="Gorilla Tag Elite COMP Logo" className="relative h-56 w-56 sm:h-64 sm:w-64 drop-shadow-2xl" />
          </div>
          <h1 className="relative text-5xl sm:text-6xl md:text-8xl mb-4 leading-[0.95]">
            <span className="hero-text inline-block -rotate-2">{t("home.heroTitleLine1")}</span>
            <br />
            <span className="hero-text inline-block rotate-2">{t("home.heroTitleLine2")}</span>
          </h1>
          <p className="relative text-lg md:text-xl max-w-3xl mx-auto mb-8 text-muted-foreground">
            {t("home.heroSubtitle")}
          </p>
          <a
            href="https://discord.gg/gtecleague"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-patch relative bg-primary text-primary-foreground hover:bg-primary -rotate-2"
          >
            <Trophy className="h-5 w-5" />
            {t("home.joinButton")}
          </a>
        </div>

        {/* Live on YouTube — only renders when GTEC is actually streaming */}
        <LiveStreamBanner />

        {/* Shop Banner — hidden entirely for regular visitors while the shop
            is disabled; admins still see it so they can preview/manage. */}
        {(settings.shop_enabled !== "false" || isAdmin) && (
          <a href="/shop" className="block mb-8 animate-fade-in">
            <div className="relative overflow-hidden rounded-xl border border-secondary/20 bg-gradient-to-r from-secondary/10 via-secondary/5 to-transparent p-5 md:p-6 hover:border-secondary/40 transition-colors">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-secondary/20 rounded-full blur-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="flex-shrink-0 rounded-full bg-secondary/15 p-3">
                  <ShoppingBag className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-0.5">{t("home.shopBannerTag")}</p>
                  <h2 className="text-lg md:text-xl font-bold">{t("home.shopBannerTitle")}</h2>
                  {settings.shop_enabled === "false" && isAdmin && (
                    <p className="text-xs text-destructive mt-1">Hidden from visitors — shop is disabled</p>
                  )}
                </div>
                <ExternalLink className="h-5 w-5 text-secondary flex-shrink-0 hidden md:block" />
              </div>
            </div>
          </a>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-12 animate-bounce-in max-w-5xl mx-auto items-stretch">
          {stats.map((stat, index) => (
            <Card key={index} className="team-card text-center h-full">
              <CardContent className="p-4 sm:p-6 h-full flex flex-col items-center justify-center">
                <stat.icon className={`h-6 w-6 sm:h-8 sm:w-8 mb-2 ${stat.color}`} />
                <div className="text-xl sm:text-2xl font-bold mb-1 break-words">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground min-h-[1rem]">
                  {"sub" in stat && stat.sub && (
                    <>
                      <span className="h-2 w-2 shrink-0 rounded-full bg-green-500 animate-pulse" />
                      {stat.sub}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Edit Stats */}
        {isAdmin && (
          <Card className="admin-panel mb-8 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit2 className="mr-2 h-5 w-5" />
                Edit Homepage Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsForm ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-muted-foreground">Teams</label>
                      <input
                        type="text"
                        value={statsForm.teams_count}
                        onChange={(e) => setStatsForm({ ...statsForm, teams_count: e.target.value })}
                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Current Season</label>
                      <input
                        type="text"
                        value={statsForm.season}
                        onChange={(e) => setStatsForm({ ...statsForm, season: e.target.value })}
                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Stage label (e.g. Elimination)</label>
                      <input
                        type="text"
                        value={statsForm.stage_label}
                        onChange={(e) => setStatsForm({ ...statsForm, stage_label: e.target.value })}
                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Stage value (e.g. Round 2)</label>
                      <input
                        type="text"
                        value={statsForm.stage_value}
                        onChange={(e) => setStatsForm({ ...statsForm, stage_value: e.target.value })}
                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Largest Gorilla Tag League rank (e.g. #5, #4, 4th)</label>
                      <input
                        type="text"
                        value={statsForm.rank_value}
                        onChange={(e) => setStatsForm({ ...statsForm, rank_value: e.target.value })}
                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Member count updates automatically from Discord.</p>
                  <div className="flex space-x-2">
                    <Button onClick={saveStats} className="flex-1">Save</Button>
                    <Button variant="outline" onClick={() => setStatsForm(null)} className="flex-1">Cancel</Button>
                  </div>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() =>
                    setStatsForm({
                      teams_count: settings.teams_count || "26",
                      season: settings.season || "4",
                      stage_label: settings.stage_label || "Elimination",
                      stage_value: settings.stage_value || "Round 2",
                      rank_value: settings.rank_value || "#5",
                    })
                  }
                >
                  Edit stats
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Live on YouTube — only renders when GTEC is actually streaming */}
        <LiveStreamBanner />

        {/* Sponsor Announcement */}
        <a href="/sponsorships" className="block mb-12 animate-fade-in">
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
            <div className="relative flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <img
                  src={apexinnoLogo}
                  alt="APEXINNO Logo"
                  className="h-16 md:h-20 object-contain"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">{t("home.sponsorTag")}</p>
                <h2 className="text-xl md:text-2xl font-bold mb-2">{t("home.sponsorTitle")}</h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  {t("home.sponsorDesc")}
                </p>
              </div>
              <ExternalLink className="h-5 w-5 text-primary flex-shrink-0 hidden md:block" />
            </div>
          </div>
        </a>

        {/* Info Sections */}
        <div className="space-y-8 mb-12">
          <Card className="team-card animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" />
                {t("home.whatIsTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("home.whatIsDesc")}
              </p>
            </CardContent>
          </Card>

          <Card className="team-card animate-fade-in" style={{animationDelay: '100ms'}}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GamepadIcon className="mr-2 h-5 w-5 text-secondary" />
                {t("home.tournamentTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("home.tournamentDescPrefix")}{" "}
                <a href="https://discord.gg/gtecleague" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {t("home.tournamentDescLink")}
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