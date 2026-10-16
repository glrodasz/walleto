import { LANGUAGE_COOKIE, parseAcceptLanguage, readCookie, resolveLanguage } from "./i18n";
import type { Language } from "../types";

interface RequestLike {
  headers: { cookie?: string; "accept-language"?: string };
}

/**
 * The language to render a request in: the `locale` cookie (the saved choice),
 * else Accept-Language, else English. Without a request (a client-side
 * navigation) it reads the same from `document.cookie` and `navigator.languages`.
 */
export function requestLanguage(req?: RequestLike): Language {
  if (req) {
    return resolveLanguage({
      cookie: readCookie(req.headers.cookie, LANGUAGE_COOKIE),
      languages: parseAcceptLanguage(req.headers["accept-language"]),
    });
  }
  if (typeof document === "undefined") return resolveLanguage({});
  return resolveLanguage({
    cookie: readCookie(document.cookie, LANGUAGE_COOKIE),
    languages: navigator.languages,
  });
}
