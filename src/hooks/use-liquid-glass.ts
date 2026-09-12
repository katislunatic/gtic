import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "gtec-liquid-glass";

function readStoredPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function applyToDocument(enabled: boolean) {
  document.documentElement.classList.toggle("liquid-glass", enabled);
}

/**
 * Controls the optional "Liquid Glass" visual mode. Off by default —
 * panels use the clean, simplified frosted-glass look from index.css.
 * When enabled, adds the `liquid-glass` class to <html>, which layers
 * in SVG refraction + specular highlights (see LiquidGlassDefs.tsx and
 * the `.liquid-glass` rules in index.css). Preference persists across
 * visits via localStorage.
 */
export function useLiquidGlass() {
  const [enabled, setEnabled] = useState<boolean>(() => readStoredPreference());

  useEffect(() => {
    applyToDocument(enabled);
  }, [enabled]);

  const toggle = useCallback((next: boolean) => {
    setEnabled(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // localStorage unavailable (private browsing, etc.) — preference just won't persist
    }
  }, []);

  return { enabled, setEnabled: toggle };
}
