import { useMemo } from "react";
import type { ReactNode } from "react";
import { useUserDoc } from "./useUserDoc";
import { DEFAULT_PREFERENCES, PreferencesContext } from "./usePreferences";
import type { Preferences } from "./usePreferences";

/** Feeds the user's saved display preferences into the context every page reads. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { userDoc } = useUserDoc();
  const value = useMemo<Preferences>(
    () => ({
      dateFormat: userDoc?.dateFormat ?? DEFAULT_PREFERENCES.dateFormat,
      weekStart: userDoc?.weekStart ?? DEFAULT_PREFERENCES.weekStart,
      language: userDoc?.language ?? DEFAULT_PREFERENCES.language,
    }),
    [userDoc?.dateFormat, userDoc?.weekStart, userDoc?.language]
  );
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
