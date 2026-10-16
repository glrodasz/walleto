import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { DEFAULT_LANGUAGE, persistLanguage } from "../helpers/i18n";
import type { Language } from "../types";
import { useUserDoc } from "./useUserDoc";
import { DEFAULT_PREFERENCES, PreferencesContext } from "./usePreferences";
import type { Preferences } from "./usePreferences";

interface Props {
  children: ReactNode;
  /**
   * The language the server rendered with (the `locale` cookie, else the
   * browser's Accept-Language; pages/_app.tsx). Used until the user doc says
   * otherwise, so the first paint already speaks the user's language.
   */
  initialLanguage?: Language;
}

/** Feeds the user's saved display preferences into the context every page reads. */
export function PreferencesProvider({ children, initialLanguage = DEFAULT_LANGUAGE }: Props) {
  const { userDoc } = useUserDoc();
  const savedLanguage = userDoc?.language;
  const language = savedLanguage ?? initialLanguage;

  // The saved choice wins on every device: mirror it in the cookie so the
  // next server render (and a reload before Firestore answers) uses it too.
  useEffect(() => {
    if (savedLanguage) persistLanguage(savedLanguage);
  }, [savedLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

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
