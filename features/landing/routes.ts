import type { Language } from "../../types";

/**
 * The landing page is the one public part of Walleto, so unlike the app it
 * has a URL per language — search engines index both and a shared link keeps
 * its language. `/` shows it to signed-out visitors in the negotiated
 * language (the app's usual cookie → browser → English).
 */
export const LANDING_PATH: Record<Language, string> = { en: "/en", es: "/es" };

/** The language a landing route pins, or null for every other route. */
export function landingLanguageFor(pathname: string): Language | null {
  const match = (Object.keys(LANDING_PATH) as Language[]).find(
    (language) => LANDING_PATH[language] === pathname
  );
  return match ?? null;
}

/** Universal Login, opened on sign-up and in the page's language. */
export function signUpHref(language: Language): string {
  return `/api/auth/login?screen_hint=signup&ui_locales=${language}`;
}

export function signInHref(language: Language): string {
  return `/api/auth/login?ui_locales=${language}`;
}
