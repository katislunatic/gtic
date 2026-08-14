import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Footer } from "@/components/Footer";
import { MessageCircle, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StaffCategory {
  id: string;
  name: string;
  color: string | null;
  sort_order: number;
  discord_role_id: string | null;
  is_badge_only?: boolean;
}

interface StaffMember {
  id: string;
  category_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  discord_user_id: string | null;
  sort_order: number;
  is_synced?: boolean;
  badge?: string | null;
  decoration_url?: string | null;
}

interface StaffProps {
  isAdmin?: boolean;
}

const BUCKET = "site-assets";

export const Staff = ({ isAdmin = false }: StaffProps) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<StaffCategory[]>([]);
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [newCategory, setNewCategory] = useState({ name: "", color: "#5865F2", discord_role_id: "" });
  const [newMember, setNewMember] = useState({
    category_id: "",
    username: "",
    display_name: "",
    discord_user_id: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const load = async () => {
    const [{ data: cats }, { data: mems }] = await Promise.all([
      supabase.from("staff_categories").select("*").order("sort_order").order("created_at"),
      supabase.from("staff_members").select("*").order("sort_order").order("created_at"),
    ]);
    setCategories((cats as StaffCategory[]) ?? []);
    setMembers((mems as StaffMember[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  // Auto-sync from Discord (throttled server-side to once every 5 minutes)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.functions.invoke("discord-staff-sync");
      if (data && !(data as any).skipped) load();
    })();
  }, []);

  const syncNow = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("discord-staff-sync?force=1");
    setSyncing(false);
    const err = error?.message ?? (data as any)?.error;
    if (err) {
      toast({ title: "Sync failed", description: err, variant: "destructive" });
      return;
    }
    toast({ title: "Synced", description: `${(data as any)?.synced ?? 0} staff members updated from Discord.` });
    load();
  };

  // Resolve storage paths to signed URLs
  useEffect(() => {
    const paths = members
      .flatMap((m) => [m.avatar_url, m.banner_url])
      .filter((p): p is string => !!p && !p.startsWith("http") && !signedUrls[p]);
    if (paths.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries: Record<string, string> = {};
      for (const p of paths) {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(p, 60 * 60 * 24 * 365);
        if (data?.signedUrl) entries[p] = data.signedUrl;
      }
      if (!cancelled && Object.keys(entries).length) {
        setSignedUrls((prev) => ({ ...prev, ...entries }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [members]);

  const resolve = (path: string | null) => {
    if (!path) return undefined;
    return path.startsWith("http") ? path : signedUrls[path];
  };

  const uploadFile = async (file: File, folder: string) => {
    const path = `staff/${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  const addCategory = async () => {
    if (!newCategory.name.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("staff_categories").insert({
      name: newCategory.name.trim(),
      color: newCategory.color || null,
      discord_role_id: newCategory.discord_role_id.trim() || null,
      sort_order: categories.length,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setNewCategory({ name: "", color: "#5865F2", discord_role_id: "" });
    toast({ title: "Role added" });
    load();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("staff_categories").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const addMember = async () => {
    if (!newMember.category_id || !newMember.username.trim()) {
      toast({ title: "Missing info", description: "Pick a role and enter a username.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const avatar_url = avatarFile ? await uploadFile(avatarFile, "avatars") : null;
      const banner_url = bannerFile ? await uploadFile(bannerFile, "banners") : null;
      const { error } = await supabase.from("staff_members").insert({
        category_id: newMember.category_id,
        username: newMember.username.trim(),
        display_name: newMember.display_name.trim() || newMember.username.trim(),
        discord_user_id: newMember.discord_user_id.trim() || null,
        avatar_url,
        banner_url,
        sort_order: members.length,
      });
      if (error) throw error;
      setNewMember({ category_id: newMember.category_id, username: "", display_name: "", discord_user_id: "" });
      setAvatarFile(null);
      setBannerFile(null);
      toast({ title: "Staff member added" });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const deleteMember = async (id: string) => {
    const { error } = await supabase.from("staff_members").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  return (
    <div className="min-h-screen pt-24 pb-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="hero-text">Staff</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Meet the team keeping Gorilla Tag Elite COMP running.
          </p>
        </div>

        {isAdmin && (
          <div className="grid gap-6 lg:grid-cols-2 mb-12">
            <Card className="admin-panel">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="mr-2 h-5 w-5" /> Add Role / Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Role name</Label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Owner, Admin, Moderator…"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role color (optional)</Label>
                  <Input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="h-10 w-24 p-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discord role ID (optional — enables auto-sync)</Label>
                  <Input
                    value={newCategory.discord_role_id}
                    onChange={(e) => setNewCategory({ ...newCategory, discord_role_id: e.target.value })}
                    placeholder="123456789012345678"
                  />
                  <p className="text-xs text-muted-foreground">
                    Roles are ranked by the order they're created — the first one a member has wins.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addCategory} disabled={busy} className="flex-1">
                    Add Role
                  </Button>
                  <Button onClick={syncNow} disabled={syncing} variant="outline" className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Syncing…" : "Sync now"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="admin-panel">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" /> Add Staff Member
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={newMember.category_id}
                    onValueChange={(v) => setNewMember({ ...newMember, category_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={newMember.username}
                      onChange={(e) => setNewMember({ ...newMember, username: e.target.value })}
                      placeholder="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Display name</Label>
                    <Input
                      value={newMember.display_name}
                      onChange={(e) => setNewMember({ ...newMember, display_name: e.target.value })}
                      placeholder="Display Name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Discord user ID (for Open DMs)</Label>
                  <Input
                    value={newMember.discord_user_id}
                    onChange={(e) => setNewMember({ ...newMember, discord_user_id: e.target.value })}
                    placeholder="123456789012345678"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Profile picture</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Banner (optional)</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)} />
                  </div>
                </div>
                <Button onClick={addMember} disabled={busy} className="w-full">
                  {busy ? "Saving…" : "Add Staff Member"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {categories.length === 0 && (
          <p className="text-center text-muted-foreground">No staff roles have been added yet.</p>
        )}

        <div className="space-y-12">
          {categories.filter((c) => !c.is_badge_only).map((category) => {
            const list = members.filter((m) => m.category_id === category.id);
            return (
              <section key={category.id}>
                <div className="flex items-center justify-center gap-3 mb-6">
                  <h2
                    className="text-2xl md:text-3xl font-bold"
                    style={category.color ? { color: category.color } : undefined}
                  >
                    {category.name}
                  </h2>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => deleteCategory(category.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {list.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">No members in this role yet.</p>
                ) : (
                  <div className="flex flex-wrap justify-center gap-6">
                    {list.map((member) => {
                      const banner = resolve(member.banner_url);
                      const avatar = resolve(member.avatar_url);
                      return (
                        <Card key={member.id} className="team-card overflow-hidden w-full sm:w-[320px]">
                          <div
                            className="h-24 w-full bg-muted"
                            style={
                              banner
                                ? { backgroundImage: `url(${banner})`, backgroundSize: "cover", backgroundPosition: "center" }
                                : category.color
                                ? { backgroundColor: category.color }
                                : undefined
                            }
                          />
                          <CardContent className="p-6 pt-0 -mt-10 text-center space-y-3">
                            <div className="relative mx-auto h-20 w-20">
                              <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-background bg-muted flex items-center justify-center">
                                {avatar ? (
                                  <img src={avatar} alt={`${member.display_name} profile picture`} className="h-full w-full object-cover" />
                                ) : (
                                  <Users className="h-8 w-8 text-muted-foreground" />
                                )}
                              </div>
                              {member.decoration_url && (
                                <img
                                  src={member.decoration_url}
                                  alt=""
                                  aria-hidden="true"
                                  className="pointer-events-none absolute left-1/2 top-1/2 h-[124%] w-[124%] -translate-x-1/2 -translate-y-1/2 max-w-none"
                                />
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">{member.display_name}</h3>
                              <p className="text-sm text-muted-foreground">@{member.username}</p>
                              {member.badge && (
                                <span
                                  className="mt-2 inline-block rounded-full border px-3 py-1 text-xs font-medium"
                                  style={
                                    category.color
                                      ? { borderColor: category.color, color: category.color }
                                      : undefined
                                  }
                                >
                                  {member.badge}
                                </span>
                              )}
                            </div>
                            {member.discord_user_id && (
                              <a
                                href={`https://discord.com/users/${member.discord_user_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm" className="gap-2">
                                  <MessageCircle className="h-4 w-4" />
                                  Open DMs
                                </Button>
                              </a>
                            )}
                            {isAdmin && (
                              <Button variant="ghost" size="sm" onClick={() => deleteMember(member.id)}>
                                <Trash2 className="h-4 w-4 mr-1" /> Remove
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};
