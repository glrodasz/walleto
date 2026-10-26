import Link from "next/link";
import type { Language } from "../../../types";
import { Globe } from "../../../components/atoms/Icons";
import { translate, translator } from "../../../helpers/i18n";
import { LANGUAGE_NAMES } from "../../../i18n/locale";
import { UI_MESSAGES } from "../../../messages/ui";
import { LANDING_MESSAGES } from "../messages";
import { LANDING_PATH, signInHref } from "../routes";

interface Props {
  language: Language;
  /** A signed-in visitor (on /en or /es) goes straight back into the app. */
  signedIn: boolean;
}

const OTHER: Record<Language, Language> = { en: "es", es: "en" };

/** Logo, the other language, and the way in. */
export function LandingNav({ language, signedIn }: Props) {
  const t = translator(LANDING_MESSAGES, language);
  const other = OTHER[language];

  return (
    <header className="nav glass glass--strong">
      <Link className="brand" href={LANDING_PATH[language]}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a 24px SVG needs no optimising */}
        <img src="/favicon.svg" alt="" width={28} height={28} />
        <span>Walleto</span>
      </Link>

      <nav className="actions" aria-label="Walleto">
        <Link
          className="lang"
          href={LANDING_PATH[other]}
          hrefLang={other}
          lang={other}
          aria-label={translate(UI_MESSAGES, other, "language.switchTo")}
        >
          <Globe size={14} />
          <span>{LANGUAGE_NAMES[other]}</span>
        </Link>
        {signedIn ? (
          <Link className="cta" href="/">
            {t("nav.openApp")}
          </Link>
        ) : (
          // An Auth0 SDK route, not a Next page — it must stay <a>.
          <a className="cta" href={signInHref(language)}>
            {t("nav.signIn")}
          </a>
        )}
      </nav>

      <style jsx>{`
        .nav {
          position: sticky;
          top: 12px;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 8px 8px 16px;
          border-radius: var(--r-pill);
        }

        .nav :global(.brand) {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          gap: 8px;
          color: var(--fg-0);
          font-weight: 700;
          font-size: 1.05rem;
          letter-spacing: -0.01em;
        }

        .nav :global(.brand img) {
          border-radius: 8px;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .actions :global(a) {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          padding: 0 14px;
          border-radius: var(--r-pill);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--fg-1);
          white-space: nowrap;
        }

        .actions :global(a:hover) {
          color: var(--fg-0);
        }

        .actions :global(.lang) {
          gap: 6px;
        }

        .actions :global(.cta) {
          background: var(--accent);
          color: var(--on-accent);
        }

        .actions :global(.cta:hover) {
          background: var(--accent-hover);
          color: var(--on-accent);
        }

        @media (max-width: 479px) {
          .nav {
            padding-left: 12px;
          }

          .actions :global(a) {
            padding: 0 10px;
          }
        }
      `}</style>
    </header>
  );
}
