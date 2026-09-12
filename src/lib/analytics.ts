import { supabase } from "@/integrations/supabase/client";

const CONSENT_KEY = "cookieConsentAccepted";
const SESSION_KEY = "gtec_session_id";

// Tracking only runs once the cookie banner has actually been accepted —
// before that, this returns false and no page view is recorded.
export const hasAnalyticsConsent = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CONSENT_KEY) === "true";
};

// A random id stored in the browser so repeat page views can be grouped
// into a "session" for the unique-visitor count, without any personal
// data (no login, no IP, no fingerprinting) attached to it.
const getOrCreateSessionId = (): string => {
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

// The page view currently being timed. When the visitor navigates away (or
// closes the tab), we send how long they stayed on it so the admin panel can
// show "time on page" per tab.
let currentViewId: string | null = null;
let currentViewStart = 0;

const flushDuration = () => {
  if (!currentViewId) return;
  const id = currentViewId;
  const ms = Math.round(performance.now() - currentViewStart);
  currentViewId = null;
  void supabase.rpc("track_page_duration" as never, { _id: id, _ms: ms } as never);
};

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushDuration);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushDuration();
  });
}

export const trackPageView = async (path: string) => {
  if (!hasAnalyticsConsent()) return;
  // Close out the previous page's timer before starting the new one.
  flushDuration();
  try {
    const { data } = await supabase.rpc("track_page_view" as never, {
      _path: path,
      _session_id: getOrCreateSessionId(),
      _referrer: document.referrer ? new URL(document.referrer).hostname : "",
    } as never);
    if (typeof data === "string") {
      currentViewId = data;
      currentViewStart = performance.now();
    }
  } catch {
    // Analytics is best-effort — a failed insert should never break navigation.
  }
};

export interface PageViewStats {
  total: number;
  today: number;
  week: number;
  month: number;
  year: number;
  unique_sessions_today: number;
  unique_sessions_week: number;
  unique_sessions_month: number;
  unique_sessions_total: number;
  avg_duration_ms: number;
  top_pages: { path: string; views: number; visitors: number; avg_duration_ms: number }[];
  daily: { day: string; views: number; visitors: number }[];
  referrers: { source: string; views: number }[];
}

export const fetchPageViewStats = async (): Promise<PageViewStats | null> => {
  const { data, error } = await supabase.rpc("get_page_view_stats" as never);
  if (error || !data) return null;
  return data as unknown as PageViewStats;
};

export const formatDuration = (ms: number): string => {
  if (!ms || ms < 1000) return "0s";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};
