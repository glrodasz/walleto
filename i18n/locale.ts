// ── App config ─────────────────────────────────────────────────────────────
export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";
/** Registrable domain shared by sibling apps; undefined = host-only cookie. */
export const COOKIE_DOMAIN: string | undefined = undefined;
/**
 * Never auto-redirected (segment-boundary match). The API and Auth0's
 * callbacks, Next's own assets and the static Storybook build aren't pages.
 */
export const EXEMPT_PATHS = ["/api", "/_next", "/storybook"];

export const LANGUAGE_NAMES: Record<Locale, string> = { en: "English", es: "Español" };
export const OG_LOCALES: Record<Locale, string> = { en: "en_US", es: "es_ES" };

/** Every URL that exists for one piece of content, current page included. */
export type Alternates = Partial<Record<Locale, string>>;

// ── Core ───────────────────────────────────────────────────────────────────
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** The non-default locale prefix of a path, or null when unprefixed. */
export function localePrefix(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  return segment !== DEFAULT_LOCALE && isLocale(segment) ? segment : null;
}

/** The locale a URL renders in. */
export function pageLocale(pathname: string): Locale {
  return localePrefix(pathname) ?? DEFAULT_LOCALE;
}

export function stripLocale(pathname: string): string {
  const prefix = localePrefix(pathname);
  return prefix ? pathname.slice(prefix.length + 1) || "/" : pathname;
}

/** Build every internal link through this. */
export function localizePath(pathname: string, locale: Locale): string {
  const bare = stripLocale(pathname);
  if (locale === DEFAULT_LOCALE) return bare;
  return bare === "/" ? `/${locale}` : `/${locale}${bare}`;
}

/** Counterpart URL for the toggle. Pages with per-language slugs pass `alternates`. */
export function switchLocalePath(
  pathname: string,
  target: Locale,
  alternates?: Alternates
): string {
  if (alternates) return alternates[target] ?? localizePath("/", target);
  return localizePath(pathname, target);
}

/** Accept-Language → tags ordered by q (stable); q=0 and '*' dropped. */
export function parseAcceptLanguage(header: string | null): string[] {
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

function isExempt(pathname: string): boolean {
  return EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Where to send a request, or null to render it as-is. */
export function resolveLocaleRedirect(input: {
  pathname: string;
  savedLocale: string | null;
  languages: readonly string[];
}): string | null {
  const { pathname, savedLocale, languages } = input;
  if (localePrefix(pathname) || isExempt(pathname)) return null;
  const target = isLocale(savedLocale) ? savedLocale : negotiateLocale(languages);
  return target === DEFAULT_LOCALE ? null : localizePath(pathname, target);
}

/** Parses both a Cookie request header and document.cookie. */
export function readCookie(cookies: string | null, name: string): string | null {
  for (const part of cookies?.split(";") ?? []) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** The <link rel="alternate" hreflang> set, x-default included. */
export function alternateLinks(pathname: string, origin: string, alternates?: Alternates) {
  const links = LOCALES.flatMap((locale) => {
    const path = alternates ? alternates[locale] : localizePath(pathname, locale);
    return path ? [{ hreflang: locale as string, href: new URL(path, origin).href }] : [];
  });
  const fallback = links.find((link) => link.hreflang === DEFAULT_LOCALE);
  return fallback ? [...links, { hreflang: "x-default", href: fallback.href }] : links;
}
