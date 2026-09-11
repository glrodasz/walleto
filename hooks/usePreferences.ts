import { createContext, useCallback, useContext } from "react";
import { DEFAULT_DATE_FORMAT, formatDate } from "../helpers/dates";
import type { DateStyle } from "../helpers/dates";
import { DEFAULT_LANGUAGE } from "../helpers/i18n";
import type { DateFormat, Language, WeekStart } from "../types";

export interface Preferences {
  dateFormat: DateFormat;
  weekStart: WeekStart;
  language: Language;
}

export const DEFAULT_PREFERENCES: Preferences = {
  dateFormat: DEFAULT_DATE_FORMAT,
  weekStart: 1,
  language: DEFAULT_LANGUAGE,
};

/**
 * Display preferences, read from React context so presentational components
 * never touch Firestore. `PreferencesProvider` (hooks/PreferencesProvider.tsx)
 * fills it from the user doc; without a provider the defaults apply.
 */
export const PreferencesContext = createContext<Preferences>(DEFAULT_PREFERENCES);

export function usePreferences(): Preferences {
  return useContext(PreferencesContext);
}

/** `formatDate` bound to the user's date format. */
export function useDateFormat() {
  const { dateFormat } = usePreferences();
  const fmt = useCallback(
    (date: Date, style: DateStyle) => formatDate(date, style, dateFormat),
    [dateFormat]
  );
  return { format: dateFormat, formatDate: fmt };
}
