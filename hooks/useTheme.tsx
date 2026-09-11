import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Head from "next/head";
import { useUserDoc } from "./useUserDoc";
import type { ThemePreference } from "../types";

export type { ThemePreference };
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "waletto:theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Colour painted behind the browser chrome on phones, per resolved theme. */
export const THEME_COLOR: Record<ResolvedTheme, string> = { light: "#eef2f7", dark: "#0a0a0f" };

const isPreference = (v: unknown): v is ThemePreference =>
  v === "light" || v === "dark" || v === "system";

function readStored(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return isPreference(v) ? v : "system";
  } catch {
    return "system";
  }
}

function systemTheme(): ResolvedTheme {
  return typeof window !== "undefined" && window.matchMedia?.(DARK_QUERY).matches
    ? "dark"
    : "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? systemTheme() : preference;
}

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: "light",
  resolved: "light",
  setPreference: async () => {},
});

/**
 * Owns the `data-theme` attribute on <html>. The inline script in _document
 * sets it before first paint from localStorage; this provider takes over on
 * mount, follows the user's saved preference when the user doc arrives (a new
 * device gets the choice made elsewhere) and tracks the OS while "system".
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { userDoc, update } = useUserDoc();
  const [preference, setLocal] = useState<ThemePreference>("light");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  // Hydrate from what the boot script already applied.
  useEffect(() => {
    const stored = readStored();
    setLocal(stored);
    setResolved(resolveTheme(stored));
  }, []);

  // The saved preference wins over the local cache once known.
  const saved = userDoc?.theme;
  useEffect(() => {
    if (!isPreference(saved)) return;
    setLocal(saved);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, saved);
    } catch {
      // Storage off: the attribute is still applied below.
    }
  }, [saved]);

  useEffect(() => {
    const apply = () => setResolved(resolveTheme(preference));
    apply();
    if (preference !== "system" || !window.matchMedia) return;
    const mq = window.matchMedia(DARK_QUERY);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [preference]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  const setPreference = useCallback(
    async (next: ThemePreference) => {
      setLocal(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      await update({ theme: next });
    },
    [update]
  );

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference]
  );

  return (
    <ThemeContext.Provider value={value}>
      <Head>
        <meta name="theme-color" content={THEME_COLOR[resolved]} />
      </Head>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
