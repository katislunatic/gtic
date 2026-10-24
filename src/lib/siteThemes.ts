import { useSyncExternalStore } from "react";

// Tiny store for the site-wide seasonal theme (Admin Panel -> Theme).
//
// App.tsx reads `site_theme` from the site settings, normalises it here, and
// pushes it into the store. The store mirrors the value onto <html> as
// `data-site-theme` (which src/themes.css keys off) and notifies subscribers,
// so the logo and the effects layer can react without prop drilling.

export const SITE_THEMES = ["default", "halloween", "christmas"] as const;

export type SiteTheme = (typeof SITE_THEMES)[number];

const listeners = new Set<(theme: SiteTheme) => void>();

let activeTheme: SiteTheme = "default";

// Unknown, empty or mistyped values fall back to "default" so a bad row in
// site_settings can never leave the site half-themed.
export const normalizeSiteTheme = (value?: string | null): SiteTheme => {
  const candidate = (value ?? "").trim().toLowerCase();
  return SITE_THEMES.includes(candidate as SiteTheme) ? (candidate as SiteTheme) : "default";
};

export const getActiveSiteTheme = (): SiteTheme => activeTheme;

export const setActiveSiteTheme = (theme: SiteTheme) => {
  activeTheme = theme;
  if (typeof document !== "undefined") {
    if (theme === "default") {
      delete document.documentElement.dataset.siteTheme;
    } else {
      document.documentElement.dataset.siteTheme = theme;
    }
  }
  listeners.forEach((listener) => listener(theme));
};

export const subscribeSiteTheme = (listener: (theme: SiteTheme) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// React view of the store. useSyncExternalStore keeps every subscribed
// component in step with the last value App.tsx pushed.
export const useSiteTheme = (): SiteTheme =>
  useSyncExternalStore(subscribeSiteTheme, getActiveSiteTheme, () => "default" as SiteTheme);
