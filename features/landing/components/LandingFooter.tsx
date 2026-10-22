import Link from "next/link";
import type { Language } from "../../../types";
import { translator } from "../../../helpers/i18n";
import { GITHUB_REPO_URL } from "../../../constants";
import { LANDING_MESSAGES } from "../messages";

export function LandingFooter({ language }: { language: Language }) {
  const t = translator(LANDING_MESSAGES, language);
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "walleto@guillermorodas.com";
  return (
    <footer className="footer">
      <p className="tagline">
        <strong>Walleto</strong> · {t("footer.tagline")}
      </p>
      <nav className="links" aria-label="Walleto">
        <Link href="/privacy">{t("footer.privacy")}</Link>
        <a href={GITHUB_REPO_URL} rel="noopener">
          {t("footer.source")}
        </a>
        <a href={`mailto:${support}`}>{t("footer.contact")}</a>
      </nav>
      <style jsx>{`
        .footer {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px 24px;
          padding: 24px 4px 8px;
          border-top: 1px solid var(--line);
          color: var(--fg-2);
          font-size: 0.875rem;
        }

        .tagline {
          margin: 0;
        }

        .tagline strong {
          color: var(--fg-0);
        }

        .links {
          display: flex;
          flex-wrap: wrap;
          gap: 4px 20px;
        }

        .links :global(a) {
          color: var(--fg-1);
          font-weight: 600;
        }

        .links :global(a:hover) {
          color: var(--fg-0);
        }
      `}</style>
    </footer>
  );
}
