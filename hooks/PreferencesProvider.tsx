import { useMemo } from "react";
import type { ReactNode } from "react";
import { DEFAULT_LANGUAGE } from "../helpers/i18n";
import type { Language } from "../types";
import { useUserDoc } from "./useUserDoc";
import { DEFAULT_PREFERENCES, PreferencesContext } from "./usePreferences";
import type { Preferences } from "./usePreferences";

interface Props {
  children: ReactNode;
  /** The page's language — the URL's (pages/_app.tsx), or Storybook's toolbar. */
  language?: Language;
}

/** Feeds the user's saved display preferences into the context every page reads. */
export function PreferencesProvider({ children, language = DEFAULT_LANGUAGE }: Props) {
  const { userDoc } = useUserDoc();
  const value = useMemo<Preferences>(
    () => ({
      dateFormat: userDoc?.dateFormat ?? DEFAULT_PREFERENCES.dateFormat,
      weekStart: userDoc?.weekStart ?? DEFAULT_PREFERENCES.weekStart,
      language,
      decimalSeparator: userDoc?.decimalSeparator ?? DEFAULT_PREFERENCES.decimalSeparator,
      decimals: userDoc?.decimals ?? DEFAULT_PREFERENCES.decimals,
    }),
    [
      userDoc?.dateFormat,
      userDoc?.weekStart,
      language,
      userDoc?.decimalSeparator,
      userDoc?.decimals,
    ]
  );
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
