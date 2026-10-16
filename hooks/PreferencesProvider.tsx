import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DEFAULT_LANGUAGE } from "../helpers/i18n";
import { persistLocale } from "../i18n/persistLocale";
import type { Language } from "../types";
import { useUserDoc } from "./useUserDoc";
import { DEFAULT_PREFERENCES, PreferencesContext, SetLanguageContext } from "./usePreferences";
import type { Preferences } from "./usePreferences";

interface Props {
  children: ReactNode;
  /**
   * What the server rendered in (pages/_app.tsx: the `locale` cookie, else
   * Accept-Language), or Storybook's toolbar.
   */
  language?: Language;
}

/** Feeds the user's saved display preferences into the context every page reads. */
export function PreferencesProvider({ children, language: initial = DEFAULT_LANGUAGE }: Props) {
  const { userDoc } = useUserDoc();
  const [language, setLanguageState] = useState<Language>(initial);
  // A new resolution from outside (another tab changed the cookie, Storybook's
  // toolbar) replaces the current one.
  useEffect(() => setLanguageState(initial), [initial]);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    persistLocale(next);
    setLanguageState(next);
  }, []);

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
  return (
    <SetLanguageContext.Provider value={setLanguage}>
      <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
    </SetLanguageContext.Provider>
  );
}
