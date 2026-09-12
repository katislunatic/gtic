import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { GripVertical, RefreshCw, X, Eye, BarChart3, Globe, Users, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchPageViewStats, formatDuration, type PageViewStats } from "@/lib/analytics";
import { OWNER_DISCORD_ID, useDiscordAuth } from "@/hooks/use-discord-auth";

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  shopEnabled: boolean;
  onShopEnabledChange: (enabled: boolean) => void;
  aiEnabled: boolean;
  onAiEnabledChange: (enabled: boolean) => void;
  maintenanceMode: boolean;
  onMaintenanceModeChange: (enabled: boolean) => void;
  viewAsVisitor: boolean;
  onViewAsVisitorChange: (enabled: boolean) => void;
  // Which category section to land on/expand when the panel opens — set from
  // the hover flyout on the nav trigger so clicking e.g. "Analytics" there
  // opens the panel with that category already expanded instead of always
  // defaulting to Site Visibility.
  initialSection?: string;
}

// A small floating, draggable admin panel — home for site-wide admin toggles
// (starting with Shop Visibility) so future settings land here instead of
// getting stuffed into the regular Settings popover. Rendered as a portal so
// it floats above everything and can be dragged anywhere on screen.
export const AdminPanel = ({
  open,
  onClose,
  shopEnabled,
  onShopEnabledChange,
  aiEnabled,
  onAiEnabledChange,
  maintenanceMode,
  onMaintenanceModeChange,
  viewAsVisitor,
  onViewAsVisitorChange,
  initialSection,
}: AdminPanelProps) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [openSections, setOpenSections] = useState<string[]>(["site-visibility"]);

  // Whenever the panel is (re)opened with a target section (from the nav's
  // hover flyout), make sure that section is expanded — on top of whatever
  // was already open, not replacing it.
  useEffect(() => {
    if (open && initialSection) {
      setOpenSections((prev) => (prev.includes(initialSection) ? prev : [...prev, initialSection]));
    }
  }, [open, initialSection]);
  const dragState = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [syncingStaff, setSyncingStaff] = useState(false);
  const [stats, setStats] = useState<PageViewStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const { toast } = useToast();

  // Same force-sync action as the "Sync now" button on the Staff page, just
  // reachable from anywhere on the site now instead of only while you're
  // already on /staff.
  const syncStaffNow = async () => {
    setSyncingStaff(true);
    const { data, error } = await supabase.functions.invoke("discord-staff-sync?force=1");
    setSyncingStaff(false);
    const err = error?.message ?? (data as any)?.error;
    if (err) {
      toast({ title: "Sync failed", description: err, variant: "destructive" });
      return;
    }
    toast({ title: "Synced", description: `${(data as any)?.synced ?? 0} staff members updated from Discord.` });
  };

  const { isOwner } = useDiscordAuth();
  const [admins, setAdmins] = useState<{ discord_user_id: string; username: string | null }[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [newAdminId, setNewAdminId] = useState("");

  // The admin allow-list lives behind the edge function so the owner check
  // happens server-side, not in the browser.
  const loadAdmins = async () => {
    setLoadingAdmins(true);
    const { data, error } = await supabase.functions.invoke("discord-auth", { body: { action: "list-admins" } });
    setLoadingAdmins(false);
    const err = error?.message ?? (data as any)?.error;
    if (err) {
      toast({ title: "Couldn't load admins", description: err, variant: "destructive" });
      return;
    }
    setAdmins((data as any)?.admins ?? []);
  };

  const manageAdmin = async (action: "add-admin" | "remove-admin", discord_user_id: string) => {
    setSavingAdmin(true);
    const { data, error } = await supabase.functions.invoke("discord-auth", {
      body: { action, discord_user_id },
    });
    setSavingAdmin(false);
    const err = error?.message ?? (data as any)?.error;
    if (err) {
      toast({ title: "Couldn't update admins", description: err, variant: "destructive" });
      return;
    }
    setAdmins((data as any)?.admins ?? []);
    setNewAdminId("");
    toast({ title: action === "add-admin" ? "Admin added" : "Admin removed" });
  };

  const loadStats = async () => {
    setLoadingStats(true);
    const result = await fetchPageViewStats();
    setLoadingStats(false);
    if (!result) {
      toast({ title: "Couldn't load stats", variant: "destructive" });
      return;
    }
    setStats(result);
  };

  // Center the panel the first time it opens.
  useEffect(() => {
    if (open && position === null && typeof window !== "undefined") {
      const width = 320;
      const height = 420;
      setPosition({
        x: Math.max(16, (window.innerWidth - width) / 2),
        y: Math.max(16, (window.innerHeight - height) / 3),
      });
    }
  }, [open, position]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragState.current = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return;
    const width = panelRef.current?.offsetWidth ?? 320;
    const height = panelRef.current?.offsetHeight ?? 220;
    const x = Math.min(Math.max(0, e.clientX - dragState.current.offsetX), window.innerWidth - width);
    const y = Math.min(Math.max(0, e.clientY - dragState.current.offsetY), window.innerHeight - height);
    setPosition({ x, y });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[100] w-80 glass-panel shadow-2xl select-none"
      style={{ left: position?.x ?? 0, top: position?.y ?? 0, visibility: position ? "visible" : "hidden" }}
    >
      {/* Drag handle / header */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex items-center justify-between px-4 py-3 border-b border-border cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Admin Panel</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose} aria-label="Close admin panel">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body — categories collapse/expand so future admin toggles land in
          a group instead of piling up as one long flat list. */}
      <div className="p-2 max-h-[70vh] overflow-y-auto">
        <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="w-full">
          {/* Site Visibility */}
          <AccordionItem value="site-visibility" className="border-border">
            <AccordionTrigger className="px-2 text-sm hover:no-underline">
              <span className="flex items-center gap-2">
                <Globe className="h-4 w-4" /> Site Visibility
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Shop Visibility</Label>
                  <p className="text-xs text-muted-foreground">
                    {shopEnabled ? "Visible to everyone" : "Hidden from visitors (admin only)"}
                  </p>
                </div>
                <Switch checked={shopEnabled} onCheckedChange={onShopEnabledChange} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">AI Assistant</Label>
                  <p className="text-xs text-muted-foreground">
                    {aiEnabled ? "Anyone can use the AI chat widget" : "Hidden from visitors (admin only)"}
                  </p>
                </div>
                <Switch checked={aiEnabled} onCheckedChange={onAiEnabledChange} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Maintenance Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    {maintenanceMode ? "Whole site is down for visitors" : "Site is live for everyone"}
                  </p>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={onMaintenanceModeChange} />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Preview */}
          <AccordionItem value="preview" className="border-border">
            <AccordionTrigger className="px-2 text-sm hover:no-underline">
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" /> Preview
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">View as Visitor</Label>
                  <p className="text-xs text-muted-foreground">
                    {viewAsVisitor ? "Previewing the site as a visitor would see it" : "Preview the site without logging out"}
                  </p>
                </div>
                <Switch checked={viewAsVisitor} onCheckedChange={onViewAsVisitorChange} />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Staff */}
          <AccordionItem value="staff" className="border-border">
            <AccordionTrigger className="px-2 text-sm hover:no-underline">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Staff
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-2 space-y-2">
              <p className="text-xs text-muted-foreground">
                Force-refresh staff roles/avatars from Discord right now, from anywhere on the site.
              </p>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={syncStaffNow}
                disabled={syncingStaff}
              >
                <RefreshCw className={`h-4 w-4 ${syncingStaff ? "animate-spin" : ""}`} />
                {syncingStaff ? "Syncing…" : "Sync Staff Now"}
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* Analytics — pulled from the page_views table, which is only ever
              written to once a visitor accepts the cookie banner (see
              src/lib/analytics.ts). This is what makes the cookie consent
              popup functionally meaningful, instead of purely decorative. */}
          <AccordionItem value="analytics" className="border-border">
            <AccordionTrigger className="px-2 text-sm hover:no-underline">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Analytics
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-2 space-y-3">
              <p className="text-xs text-muted-foreground">
                Anonymous page views from visitors who accepted the cookie banner.
              </p>
              {stats && (
                <>
                  <div className="grid grid-cols-4 gap-2 text-center py-1">
                    {[
                      { label: "Today", views: stats.today, visitors: stats.unique_sessions_today },
                      { label: "7 days", views: stats.week, visitors: stats.unique_sessions_week },
                      { label: "30 days", views: stats.month, visitors: stats.unique_sessions_month },
                      { label: "1 year", views: stats.year, visitors: stats.unique_sessions_total },
                    ].map((b) => (
                      <div key={b.label}>
                        <p className="text-lg font-semibold">{b.views}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{b.label}</p>
                        <p className="text-[10px] text-muted-foreground">{b.visitors} ppl</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between rounded-md bg-muted/30 px-2 py-1.5 text-xs">
                    <span className="text-muted-foreground">Avg. time on page</span>
                    <span className="font-medium">{formatDuration(stats.avg_duration_ms)}</span>
                  </div>

                  {stats.top_pages.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Most visited tabs (30d)</p>
                      {stats.top_pages.map((p) => (
                        <div key={p.path} className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate text-muted-foreground">{p.path}</span>
                          <span className="shrink-0 font-medium">
                            {p.views} · {formatDuration(p.avg_duration_ms)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {stats.daily.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Last 14 days</p>
                      <div className="flex items-end gap-[3px] h-16">
                        {stats.daily.map((d) => {
                          const max = Math.max(...stats.daily.map((x) => x.views), 1);
                          return (
                            <div
                              key={d.day}
                              title={`${d.day}: ${d.views} views / ${d.visitors} visitors`}
                              className="flex-1 rounded-sm bg-primary/70"
                              style={{ height: `${Math.max(4, (d.views / max) * 100)}%` }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {stats.referrers.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Traffic sources</p>
                      {stats.referrers.map((r) => (
                        <div key={r.source} className="flex items-center justify-between text-xs">
                          <span className="truncate text-muted-foreground">{r.source}</span>
                          <span className="font-medium">{r.views}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              <Button variant="outline" className="w-full" onClick={loadStats} disabled={loadingStats}>
                {loadingStats ? "Loading…" : stats ? "Refresh Stats" : "Load Stats"}
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* Admin access — who can see the admin view, by Discord user ID.
              Everyone allow-listed can see this list; only the owner account
              can add or remove people. */}
          <AccordionItem value="admins" className="border-border">
            <AccordionTrigger className="px-2 text-sm hover:no-underline">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Admin Access
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-2 space-y-2">
              <p className="text-xs text-muted-foreground">
                Discord accounts that get the admin view when they log in.
              </p>
              {admins.map((a) => (
                <div key={a.discord_user_id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate">
                    {a.username ?? "Unknown"}{" "}
                    <span className="text-muted-foreground">{a.discord_user_id}</span>
                  </span>
                  {isOwner && a.discord_user_id !== OWNER_DISCORD_ID && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => manageAdmin("remove-admin", a.discord_user_id)}
                      aria-label="Remove admin"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {isOwner && (
                <div className="flex gap-2 pt-1">
                  <Input
                    value={newAdminId}
                    onChange={(e) => setNewAdminId(e.target.value)}
                    placeholder="Discord user ID"
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    className="h-8"
                    disabled={savingAdmin || !newAdminId.trim()}
                    onClick={() => manageAdmin("add-admin", newAdminId.trim())}
                  >
                    Add
                  </Button>
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={loadAdmins} disabled={loadingAdmins}>
                {loadingAdmins ? "Loading…" : admins.length ? "Refresh List" : "Load Admins"}
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </div>
    </div>,
    document.body
  );
};
