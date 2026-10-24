import { useSyncExternalStore } from "react";

const STORAGE_KEY = "gtec-theme-effects";

// Per-visitor on/off switch for the seasonal effects (falling snow, floating
// bats, etc). On by default; a visitor can turn it off in Settings and the
// choice sticks across visits. Shared through a tiny store so the Settings
// switch and the effects overlay always agree.

const readStored = (): boolean => {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
};

let enabled = readStored();
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const setEnabled = (next: boolean) => {
  enabled = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    // localStorage unavailable (private browsing, etc.) -- just won't persist
  }
  listeners.forEach((l) => l());
};

export function useThemeEffects() {
  const value = useSyncExternalStore(
    subscribe,
    () => enabled,
    () => true,
  );
  return { enabled: value, setEnabled };
}
