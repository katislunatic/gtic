import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDiscordAuth } from "@/hooks/use-discord-auth";
import discordLogo from "@/assets/discord-logo.svg";
import { LogOut } from "lucide-react";

// Sits at the bottom of the Settings menu: log in with Discord, and once
// signed in, show who you are. Whether you get the admin view is decided
// server-side from the Discord allow-list, not from anything here.
export const DiscordAccountSection = () => {
  const { profile, loading, login, logout } = useDiscordAuth();
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    setBusy(true);
    try {
      await login();
    } catch (e) {
      setBusy(false);
      toast({ title: "Discord login unavailable", description: String((e as Error).message), variant: "destructive" });
    }
  };

  if (loading) return null;

  if (!profile) {
    return (
      <div className="flex justify-center pt-1">
        <Button variant="outline" className="w-full gap-2" onClick={handleLogin} disabled={busy}>
          <img src={discordLogo} alt="" className="h-4 w-4" />
          {busy ? "Redirecting…" : "Login with Discord"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
      <img src={profile.avatar_url} alt="" className="h-9 w-9 rounded-full" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{profile.display_name}</p>
        <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out of Discord" className="text-destructive hover:text-destructive">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
};
