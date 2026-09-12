import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = Record<string, string>;

const CACHE_KEY = "gtec-site-settings";

// Reads the last-known settings synchronously from localStorage so the very
// first render already reflects them (e.g. the shop toggle) instead of
// briefly showing the default state while the network request is in flight.
const readCache = (): SiteSettings => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as SiteSettings) : {};
  } catch {
    return {};
  }
};

const writeCache = (settings: SiteSettings) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors (private browsing, quota, etc.) — caching is a
    // nice-to-have, not required for correctness.
  }
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(() => readCache());
  // "loading" only means "no cached value AND no fetch yet" — if we already
  // have a cached settings object, callers can treat it as ready immediately
  // while the fresh fetch happens silently in the background.
  const [loading, setLoading] = useState(() => Object.keys(readCache()).length === 0);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("site_settings").select("key, value");
    if (!error && data) {
      const fresh = Object.fromEntries(data.map((r) => [r.key, r.value]));
      setSettings(fresh);
      writeCache(fresh);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveSettings = useCallback(
    async (updates: SiteSettings) => {
      const rows = Object.entries(updates).map(([key, value]) => ({ key, value }));
      const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
      if (!error) await load();
      return error;
    },
    [load],
  );

  return { settings, loading, saveSettings, reload: load };
};
