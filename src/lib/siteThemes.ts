import { useSyncExternalStore } from "react";
import gticLogo from "@/assets/gtic-logo.png";

// Site-wide seasonal themes. The active theme is stored in the `site_theme`
// site setting (Admin Panel -> Theme), so it changes for every visitor.
// Colors live in src/themes.css, keyed off the data-site-theme attribute on
// <html>. Layout never changes -- only colors, the logo, and optional effects.

export type SiteThemeId = "default" | "halloween" | "christmas";
export type SiteThemeEffect = "none" | "snow" | "halloween";

export interface SiteThemeDef {
  id: SiteThemeId;
  label: string;
  description: string;
  logo: string;
  effect: SiteThemeEffect;
  // Shown in Settings next to the on/off switch for the effect.
  effectDescription: string;
  // Two swatches (hsl strings) for the picker in the admin panel.
  swatch: [string, string];
}

const BASE = import.meta.env.BASE_URL || "/";

// The seasonal logos are plain files in /public/themes (not bundled), so they
// can be swapped without touching code. If one is missing, ThemedLogo quietly
// falls back to the normal logo.
export const SITE_THEMES: Record<SiteThemeId, SiteThemeDef> = {
  default: {
    id: "default",
    label: "Default",
    description: "The normal GTEC look.",
    logo: gticLogo,
    effect: "none",
    effectDescription: "",
    swatch: ["hsl(212 100% 60%)", "hsl(0 100% 65%)"],
  },
  halloween: {
    id: "halloween",
    label: "Halloween",
    description: "Orange and purple, spooky logo, floating bats and pumpkins.",
    logo: `${BASE}themes/halloween-logo.png`,
    effect: "halloween",
    effectDescription: "Floating bats and pumpkins",
    swatch: ["hsl(24 100% 55%)", "hsl(275 80% 62%)"],
  },
  christmas: {
    id: "christmas",
    label: "Christmas",
    description: "Red and green, festive logo, falling snow.",
    logo: `${BASE}themes/christmas-logo.png`,
    effect: "snow",
    effectDescription: "Falling snow",
    swatch: ["hsl(0 80% 55%)", "hsl(140 65% 42%)"],
  },
};

export const SITE_THEME_IDS = Object.keys(SITE_THEMES) as SiteThemeId[];
export const DEFAULT_LOGO = gticLogo;

export const normalizeSiteTheme = (value: string | null | undefined): SiteThemeId =>
  value && value in SITE_THEMES ? (value as SiteThemeId) : "default";

// ---- tiny shared store so every component sees the same active theme ----

const SETTINGS_CACHE_KEY = "gtec-site-settings"; // same cache use-site-settings.ts writes

const readCachedTheme = (): SiteThemeId => {
  if (typeof window === "undefined") return "default";
  try {
    const raw = window.localStorage.getItem(SETTINGS_CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    return normalizeSiteTheme(parsed.site_theme);
  } catch {
    return "default";
  }
};

let activeTheme: SiteThemeId = readCachedTheme();
const listeners = new Set<() => void>();

const applyToDocument = (id: SiteThemeId) => {
  if (typeof document === "undefined") return;
  if (id === "default") document.documentElement.removeAttribute("data-site-theme");
  else document.documentElement.setAttribute("data-site-theme", id);
};

export function setActiveSiteTheme(id: SiteThemeId) {
  const changed = id !== activeTheme;
  activeTheme = id;
  applyToDocument(id);
  if (changed) listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useActiveSiteTheme(): SiteThemeId {
  return useSyncExternalStore(
    subscribe,
    () => activeTheme,
    () => "default" as SiteThemeId,
  );
}
