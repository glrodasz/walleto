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
    "settings.privacy.subtitle":
      "Your data belongs to you: read the policy, take a copy, or erase it.",
    "settings.privacy.policy": "Privacy policy",
    "settings.privacy.policy.value": "What is collected, where it lives, and your rights",
    "settings.privacy.storage": "Data storage",
    "settings.privacy.storage.value": "Google Cloud Firestore, encrypted at rest",
    "settings.privacy.export": "Data export",
    "settings.privacy.export.value": "Download everything as a JSON file",
    "settings.privacy.contact": "Privacy requests",
    "settings.privacy.delete": "Delete account",
    "settings.privacy.delete.value": "Erase all your data and sign out",
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
