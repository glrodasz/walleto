import type { Language } from "../../../types";
import { translator } from "../../../helpers/i18n";
import { ChevronDown } from "../../../components/atoms/Icons";
import { LANDING_MESSAGES } from "../messages";

const QUESTIONS = ["bank", "currencies", "phone", "tracker", "data"] as const;

/** Plain <details>, so every answer is in the HTML for readers and crawlers alike. */
export function LandingFaq({ language }: { language: Language }) {
  const t = translator(LANDING_MESSAGES, language);
  return (
    <div className="faq">
      {QUESTIONS.map((id) => (
        <details key={id} className="item glass">
          <summary>
            <span>{t(`faq.${id}.q`)}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
          <p>{t(`faq.${id}.a`)}</p>
        </details>
      ))}
      <style jsx>{`
        .faq {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .item {
          border-radius: var(--r-lg);
          padding: 0 20px;
        }

        summary {
          list-style: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-height: 56px;
          cursor: pointer;
          font-weight: 600;
          color: var(--fg-0);
        }

        summary::-webkit-details-marker {
          display: none;
        }

        summary :global(svg) {
          flex-shrink: 0;
          color: var(--fg-2);
          transition: transform 180ms ease;
        }

        .item[open] summary :global(svg) {
          transform: rotate(180deg);
        }

        p {
          margin: 0 0 18px;
          color: var(--fg-1);
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
