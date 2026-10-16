import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  LOCALE_COOKIE,
  parseAcceptLanguage,
  readCookie,
  resolveLocaleRedirect,
} from "./i18n/locale";

/**
 * Sends an unprefixed first visit to its language: the `locale` cookie (the
 * saved choice), else Accept-Language, else English (no redirect). A prefixed
 * URL is never touched — `/es/...` opens in Spanish for everyone. 307 and
 * uncached, because the target depends on who's asking.
 *
 * Next's own i18n routing (next.config.js) renders the prefixes; its
 * detection is off so this is the only detector.
 */
export function middleware(request: NextRequest) {
  // request.url keeps the locale segment; nextUrl.pathname has it stripped.
  const url = new URL(request.url);
  const target = resolveLocaleRedirect({
    pathname: url.pathname,
    savedLocale: readCookie(request.headers.get("cookie"), LOCALE_COOKIE),
    languages: parseAcceptLanguage(request.headers.get("accept-language")),
  });
  if (!target) return NextResponse.next();

  const response = NextResponse.redirect(new URL(target + url.search, url), 307);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Vary", "Cookie, Accept-Language");
  return response;
}

export const config = {
  // Skip the API (Auth0 included), build assets, Storybook and anything with a
  // file extension. "/" is listed on its own: with i18n routing on, the
  // catch-all never matches the bare root.
  matcher: ["/", "/((?!api/|_next/|storybook|.*\\.).*)"],
};
