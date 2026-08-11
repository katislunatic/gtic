import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = Record<string, string>;

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("site_settings").select("key, value");
    if (!error && data) {
      setSettings(Object.fromEntries(data.map((r) => [r.key, r.value])));
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
