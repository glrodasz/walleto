/**
 * Which language the interface speaks — the localization skill's core
 * (precedence, negotiation, the `locale` cookie) without its URL scheme:
 * every screen is behind a login and nothing is shared by link, so there are
 * no /es URLs. The language belongs to the device's saved choice instead.
 *
 *   saved choice (`locale` cookie) → browser languages → English
 *
 * Pure functions, no DOM: the same file runs on the server (_app, _document)
 * and in the browser.
 */

// ── App config ─────────────────────────────────────────────────────────────
export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";
/** Registrable domain shared by sibling apps; undefined = host-only cookie. */
export const COOKIE_DOMAIN: string | undefined = undefined;

export const LANGUAGE_NAMES: Record<Locale, string> = { en: "English", es: "Español" };

// ── Core ───────────────────────────────────────────────────────────────────
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Accept-Language → tags ordered by q (stable); q=0 and '*' dropped. */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { tag: tag.trim(), q: q ? Number(q.slice(2)) : 1, index };
    })
    .filter(({ tag, q }) => tag && tag !== "*" && q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map(({ tag }) => tag);
}

/** First supported base language in the user's priority order. */
export function negotiateLocale(languages: readonly string[]): Locale {
  for (const tag of languages) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

/** The saved choice wins; an unknown cookie value is ignored, not trusted. */
export function resolveLocale(input: {
  savedLocale: string | null;
  languages: readonly string[];
}): Locale {
  return isLocale(input.savedLocale) ? input.savedLocale : negotiateLocale(input.languages);
}

/** Parses both a Cookie request header and document.cookie. */
export function readCookie(cookies: string | null | undefined, name: string): string | null {
  for (const part of cookies?.split(";") ?? []) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

interface RequestLike {
  headers: { cookie?: string; "accept-language"?: string };
}

/**
 * A request's language (server render), or — without one, on a client-side
 * navigation — the same resolution from `document.cookie` and
 * `navigator.languages`.
 */
export function requestLocale(req?: RequestLike): Locale {
  if (req) {
    return resolveLocale({
      savedLocale: readCookie(req.headers.cookie, LOCALE_COOKIE),
      languages: parseAcceptLanguage(req.headers["accept-language"]),
    });
  }
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  return resolveLocale({
    savedLocale: readCookie(document.cookie, LOCALE_COOKIE),
    languages: navigator.languages ?? [navigator.language],
  });
}
