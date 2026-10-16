import { COOKIE_DOMAIN, LOCALE_COOKIE, type Locale } from "./locale";

export function persistLocale(locale: Locale): void {
  // Browsers reject a Domain the host isn't under, so localhost and preview deploys fall back to host-only.
  const domain =
    COOKIE_DOMAIN && location.hostname.endsWith(COOKIE_DOMAIN) ? `; domain=${COOKIE_DOMAIN}` : "";
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax${domain}${secure}`;
}
