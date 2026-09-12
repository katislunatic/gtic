import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DiscordProfile {
  discord_user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export const OWNER_DISCORD_ID = "1252981295454224390";

// Reads the Discord profile off the current Supabase session. The session
// itself is created by the discord-auth edge function after the OAuth
// round-trip, which also decides whether the account gets the admin role.
export const useDiscordAuth = () => {
  const [profile, setProfile] = useState<DiscordProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const read = (session: { user?: { user_metadata?: Record<string, unknown> } } | null) => {
      const meta = session?.user?.user_metadata as unknown as DiscordProfile | undefined;
      setProfile(meta?.discord_user_id ? meta : null);
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data }) => read(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => read(session));
    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async () => {
    const redirect_uri = `${window.location.origin}/discord-callback`;
    const { data, error } = await supabase.functions.invoke("discord-auth", {
      body: { action: "login-url", redirect_uri },
    });
    const url = (data as { url?: string } | null)?.url;
    if (error || !url) throw new Error(error?.message ?? (data as any)?.error ?? "Couldn't start Discord login");
    window.location.href = url;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return { profile, loading, login, logout, isOwner: profile?.discord_user_id === OWNER_DISCORD_ID };
};
