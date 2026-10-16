import { DEFAULT_LOCALE, LANGUAGE_NAMES, LOCALES } from "../i18n/locale";
import type { Language } from "../types";

/**
 * Interface language.
 *
 *   which       the `locale` cookie (the toggle in Settings › Preferences),
 *               else the browser's languages, else English — i18n/locale.ts,
 *               resolved on the server by _app / _document
 *   messages    one catalog per area, built with `defineMessages`: English is
 *               the type source, so a key missing in Spanish fails `tsc`
 *   formatting  dates through helpers/dates (language-aware), plurals through
 *               Intl.PluralRules, never a hand-written month name or "s"
 */

export const LANGUAGES: readonly Language[] = LOCALES;

export const DEFAULT_LANGUAGE: Language = DEFAULT_LOCALE;

/** Each language in its own name: people scan for theirs. */
export const LANGUAGE_LABELS: Record<Language, string> = LANGUAGE_NAMES;

/** BCP 47 tag handed to Intl (dates, plurals, relative days, lists). */
export const INTL_LOCALE: Record<Language, string> = { en: "en-US", es: "es-ES" };

// ── Messages ────────────────────────────────────────────────────────────────

/** A message that depends on a count: Intl.PluralRules picks the form. */
export interface PluralMessage {
  one: string;
  other: string;
}

export type Message = string | PluralMessage;

export type Params = Record<string, string | number>;

/** Spanish must carry every English key, with the same kind (plain or plural). */
type Translation<E> = { [K in keyof E]: E[K] extends string ? string : PluralMessage };

export interface Messages<E extends Record<string, Message>> {
  en: E;
  es: Translation<E>;
}

/** One area's catalog. English is the source of truth for keys. */
export function defineMessages<const E extends Record<string, Message>>(
  en: E,
  es: Translation<E>
): Messages<E> {
  return { en, es };
}

const pluralRules = new Map<Language, Intl.PluralRules>();

function pluralForm(language: Language, count: number): keyof PluralMessage {
  let rules = pluralRules.get(language);
  if (!rules) {
    rules = new Intl.PluralRules(INTL_LOCALE[language]);
    pluralRules.set(language, rules);
  }
  return rules.select(count) === "one" ? "one" : "other";
}

/** "{name}" → params.name. Unknown placeholders stay as written so a typo is visible. */
function interpolate(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

/**
 * The message for `key` in `language`, falling back to English. A plural
 * message reads `params.count`; every message interpolates `{name}` from params.
 */
export function translate<E extends Record<string, Message>>(
  messages: Messages<E>,
  language: Language,
  key: keyof E & string,
  params?: Params
): string {
  const message: Message | undefined =
    (messages[language] as Record<string, Message> | undefined)?.[key] ?? messages.en[key];
  if (message === undefined) return key;
  if (typeof message === "string") return interpolate(message, params);
  const count = Number(params?.count ?? 0);
  return interpolate(message[pluralForm(language, count)], params);
}

export type Translator<E extends Record<string, Message>> = (
  key: keyof E & string,
  params?: Params
) => string;

/** `translate` bound to one catalog and language — what `useT` hands components. */
export function translator<E extends Record<string, Message>>(
  messages: Messages<E>,
  language: Language
): Translator<E> {
  return (key, params) => translate(messages, language, key, params);
}

// ── Settings catalog (the strings that predate the per-area catalogs) ───────

const SETTINGS_MESSAGES = defineMessages(
  {
    "settings.general.title": "General",
    "settings.account.title": "Account",
    "settings.account.subtitle": "Your account information and session settings.",
    "settings.currency.title": "Currency",
    "settings.currency.subtitle": "Control how amounts are displayed and entered.",
    "settings.preferences.title": "Preferences",
    "settings.preferences.subtitle": "Personalise your experience.",
    "settings.setup.title": "Setup",
    "settings.setup.subtitle": "Tools to get the most out of Walleto.",
    "settings.privacy.title": "Data & privacy",
    "settings.privacy.subtitle": "Your data stays private and belongs to you.",
    "settings.about.title": "About",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.system": "System",
    "weekStart.monday": "Monday",
    "weekStart.sunday": "Sunday",
  },
  {
    "settings.general.title": "General",
    "settings.account.title": "Cuenta",
    "settings.account.subtitle": "La información de tu cuenta y tu sesión.",
    "settings.currency.title": "Moneda",
    "settings.currency.subtitle": "Cómo se muestran y se ingresan los montos.",
    "settings.preferences.title": "Preferencias",
    "settings.preferences.subtitle": "Ajusta la app a tu gusto.",
    "settings.setup.title": "Configuración inicial",
    "settings.setup.subtitle": "Herramientas para sacarle el máximo a Walleto.",
    "settings.privacy.title": "Datos y privacidad",
    "settings.privacy.subtitle": "Tus datos son privados y te pertenecen.",
    "settings.about.title": "Acerca de",
    "theme.light": "Claro",
    "theme.dark": "Oscuro",
    "theme.system": "Sistema",
    "weekStart.monday": "Lunes",
    "weekStart.sunday": "Domingo",
  }
);

export type MessageKey = keyof (typeof SETTINGS_MESSAGES)["en"];

/** The Settings message for a key in a language, falling back to English. */
export function t(key: MessageKey, language: Language = DEFAULT_LANGUAGE): string {
  return translate(SETTINGS_MESSAGES, language, key);
}
