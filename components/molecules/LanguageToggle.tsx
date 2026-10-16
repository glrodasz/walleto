import Link from "next/link";
import { useRouter } from "next/router";
import { Globe } from "../atoms/Icons";
import { translate } from "../../helpers/i18n";
import {
  DEFAULT_LOCALE,
  LANGUAGE_NAMES,
  LOCALES,
  isLocale,
  localizePath,
  switchLocalePath,
} from "../../i18n/locale";
import { persistLocale } from "../../i18n/persistLocale";
import { UI_MESSAGES } from "../../messages/ui";

/**
 * "Español" on an English page, "English" on a Spanish one: a real link to
 * this page's counterpart, labelled in the target language, that remembers
 * the choice (the `locale` cookie the middleware reads) on click.
 */
export function LanguageToggle() {
  const router = useRouter();
  const current = isLocale(router.locale) ? router.locale : DEFAULT_LOCALE;
  const target = LOCALES.find((locale) => locale !== current) ?? DEFAULT_LOCALE;
  // asPath comes without the locale segment; rebuild the full path, switch it,
  // and carry the query and hash (?month=, #activity) across untouched.
  const [, pathname, rest] = (router.asPath ?? "/").match(/^([^?#]*)(.*)$/) ?? ["", "/", ""];
  const href = switchLocalePath(localizePath(pathname || "/", current), target) + rest;

  return (
    <span className="toggle">
      <Link
        href={href}
        locale={false}
        className="glass glass--tap language-toggle"
        hrefLang={target}
        lang={target}
        aria-label={translate(UI_MESSAGES, target, "language.switchTo")}
        onClick={() => persistLocale(target)}
      >
        <Globe size={14} />
        <span>{LANGUAGE_NAMES[target]}</span>
      </Link>
      <style jsx>{`
        .toggle :global(.language-toggle) {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 36px;
          padding: 0 14px;
          border-radius: var(--r-pill);
          color: var(--fg-0);
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
        }
        .toggle :global(.language-toggle:focus-visible) {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
      `}</style>
    </span>
  );
}
