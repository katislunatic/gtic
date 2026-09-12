import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/Footer";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { SortableList } from "@/components/SortableList";
import { Award, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreditEntry {
  id: string;
  name: string;
  title: string;
  discord_user_id: string | null;
  sort_order: number;
}

interface CreditsProps {
  isAdmin?: boolean;
}

export const Credits = ({ isAdmin = false }: CreditsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const [newEntry, setNewEntry] = useState({ name: "", title: "", discord_user_id: "" });

  const { data: credits = [] } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credits")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CreditEntry[];
    },
    staleTime: 60_000,
  });

  const load = () => queryClient.invalidateQueries({ queryKey: ["credits"] });

  const addEntry = async () => {
    if (!newEntry.name.trim() || !newEntry.title.trim()) {
      toast({ title: "Missing info", description: "Enter a name and a title/contribution.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("credits").insert({
        name: newEntry.name.trim(),
        title: newEntry.title.trim(),
        discord_user_id: newEntry.discord_user_id.trim() || null,
        sort_order: credits.length,
      });
      if (error) throw error;
      setNewEntry({ name: "", title: newEntry.title, discord_user_id: "" });
      toast({ title: "Added to credits" });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("credits").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const reorderCredits = async (newOrder: CreditEntry[]) => {
    queryClient.setQueryData(["credits"], newOrder);
    const updates = newOrder.map((entry, index) =>
      supabase.from("credits").update({ sort_order: index }).eq("id", entry.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      toast({ title: "Error", description: "Failed to save new order", variant: "destructive" });
    }
    load();
  };

  return (
    <div className="min-h-screen pt-24 pb-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <Award className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="hero-text">Credits</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The people behind GTEC — founders, builders, and everyone whose work made this league what it is.
          </p>
        </div>

        {isAdmin && (
          <Card className="admin-panel mb-14 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-5 w-5" /> Add to Credits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newEntry.name}
                    onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                    placeholder="Display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title / category</Label>
                  <Input
                    value={newEntry.title}
                    onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                    placeholder="Founder, Bot Developer, OBS Scenes…"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Discord user ID (optional — makes their name clickable to DM)</Label>
                <Input
                  value={newEntry.discord_user_id}
                  onChange={(e) => setNewEntry({ ...newEntry, discord_user_id: e.target.value })}
                  placeholder="123456789012345678"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: entries with the same title are grouped together, like movie credits. Use the same wording for people who share a category.
              </p>
              <Button onClick={addEntry} disabled={busy} className="w-full">
                {busy ? "Saving…" : "Add to Credits"}
              </Button>
            </CardContent>
          </Card>
        )}

        {credits.length === 0 ? (
          <div className="text-center py-16">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium mb-1">No credits yet</p>
            <p className="text-sm text-muted-foreground">Once added, contributors will be listed here.</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <SortableList
              items={credits}
              onReorder={reorderCredits}
              disabled={!isAdmin}
              className=""
            >
              {(entry, dragHandle) => {
                const index = credits.findIndex((c) => c.id === entry.id);
                const prev = credits[index - 1];
                const isNewGroup = !prev || prev.title !== entry.title;
                const nameContent = entry.discord_user_id ? (
                  <a
                    href={`https://discord.com/users/${entry.discord_user_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors underline-offset-4 hover:underline"
                  >
                    {entry.name}
                  </a>
                ) : (
                  entry.name
                );
                return (
                  <div className={index === 0 ? "mt-0" : isNewGroup ? "mt-20" : "mt-7"}>
                    {isNewGroup && (
                      <h2 className="text-center text-sm sm:text-base font-semibold tracking-[0.25em] uppercase text-muted-foreground mb-5">
                        {entry.title}
                      </h2>
                    )}
                    <div className="flex items-center justify-center gap-2 text-2xl sm:text-4xl font-display">
                      {dragHandle}
                      <span>{nameContent}</span>
                      {isAdmin && (
                        <ConfirmDeleteDialog
                          trigger={
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          }
                          title={`Remove ${entry.name} from credits?`}
                          description="This can't be undone."
                          onConfirm={() => deleteEntry(entry.id)}
                        />
                      )}
                    </div>
                  </div>
                );
              }}
            </SortableList>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};
