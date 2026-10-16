import type { Language } from "../types";

/**
 * Interface language.
 *
 *   precedence  saved choice (user doc `language`, mirrored in the `locale`
 *               cookie) → the browser's languages → English
 *   messages    one catalog per area, built with `defineMessages`: English is
 *               the type source, so a key missing in Spanish fails `tsc`
 *   formatting  dates through helpers/dates (language-aware), plurals through
 *               Intl.PluralRules, never a hand-written month name or "s"
 *
 * There are no locale-prefixed URLs: every screen is behind a login, nothing
 * is crawled or shared by link, so the language is the user's, not the page's.
 */

export const LANGUAGES: readonly Language[] = ["en", "es"];

export const DEFAULT_LANGUAGE: Language = "en";

/** Each language in its own name: people scan for theirs. */
export const LANGUAGE_LABELS: Record<Language, string> = { en: "English", es: "Español" };

/** BCP 47 tag handed to Intl (dates, plurals, relative days, lists). */
export const INTL_LOCALE: Record<Language, string> = { en: "en-US", es: "es-ES" };

/** Mirrors the saved choice so the server renders the right language before Firestore answers. */
export const LANGUAGE_COOKIE = "locale";

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

/** Accept-Language → tags in the user's priority order (q, then position). */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number(q.slice(2)) : 1;
      return { tag: tag.trim(), weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((entry) => entry.tag && entry.tag !== "*" && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index)
    .map((entry) => entry.tag);
}

/** The first language in the user's list that we speak: `sv, es` → es; `en-US, es` → en. */
export function negotiateLanguage(preferred: readonly string[]): Language | null {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLanguage(base)) return base;
  }
  return null;
}

export function readCookie(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** Saved choice → browser languages → English. An unknown cookie value is ignored. */
export function resolveLanguage({
  cookie,
  languages,
}: {
  cookie?: string | null;
  languages?: readonly string[];
}): Language {
  if (isLanguage(cookie)) return cookie;
  return negotiateLanguage(languages ?? []) ?? DEFAULT_LANGUAGE;
}

/** Browser only: remembers the choice for the server's next render. */
export function persistLanguage(language: Language): void {
  if (typeof document === "undefined") return;
  if (readCookie(document.cookie, LANGUAGE_COOKIE) === language) return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LANGUAGE_COOKIE}=${language}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

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
