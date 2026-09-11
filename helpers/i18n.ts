import type { Language } from "../types";

/**
 * Message catalog for the strings that already live behind the language
 * preference. English is the only language today; the rest of the interface
 * still carries its copy inline and moves here as it is touched.
 */
const CATALOG = {
  en: {
    "settings.general.title": "General",
    "settings.account.title": "Account",
    "settings.account.subtitle": "Your account information and session settings.",
    "settings.currency.title": "Currency",
    "settings.currency.subtitle": "Control how amounts are displayed and entered.",
    "settings.preferences.title": "Preferences",
    "settings.preferences.subtitle": "Personalise your experience.",
    "settings.setup.title": "Setup",
    "settings.setup.subtitle": "Tools to get the most out of Waletto.",
    "settings.privacy.title": "Data & privacy",
    "settings.privacy.subtitle": "Your data stays private and belongs to you.",
    "settings.about.title": "About",
    "language.en": "English",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.system": "System",
    "weekStart.monday": "Monday",
    "weekStart.sunday": "Sunday",
  },
} as const satisfies Record<Language, Record<string, string>>;

export type MessageKey = keyof (typeof CATALOG)["en"];

export const DEFAULT_LANGUAGE: Language = "en";

export const LANGUAGE_LABELS: Record<Language, string> = { en: "English" };

/** The message for a key in a language, falling back to English. */
export function t(key: MessageKey, language: Language = DEFAULT_LANGUAGE): string {
  const catalog = CATALOG[language] ?? CATALOG.en;
  return catalog[key] ?? CATALOG.en[key] ?? key;
}
