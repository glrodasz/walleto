import type { Language } from "../../../types";
import { translator } from "../../../helpers/i18n";
import { Plus } from "../../../components/atoms/Icons";
import { LANDING_MESSAGES } from "../messages";

const QUESTIONS = ["bank", "currencies", "phone", "tracker", "data"] as const;

/** Plain <details>, so every answer is in the HTML for readers and crawlers alike. */
export function LandingFaq({ language }: { language: Language }) {
  const t = translator(LANDING_MESSAGES, language);
  return (
    <div className="faq">
      {QUESTIONS.map((id) => (
        <details key={id} className="item">
          <summary>
            <span>{t(`faq.${id}.q`)}</span>
            <span className="toggle" aria-hidden="true">
              <Plus size={16} />
            </span>
          </summary>
          <p>{t(`faq.${id}.a`)}</p>
        </details>
      ))}
      <style jsx>{`
        .faq {
          display: flex;
          flex-direction: column;
          border-top: 1px solid var(--line);
        }

        .item {
          border-bottom: 1px solid var(--line);
        }

        summary {
          list-style: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-height: 64px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1.05rem;
          color: var(--fg-0);
        }

        summary::-webkit-details-marker {
          display: none;
        }

        .toggle {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid var(--line-strong);
          color: var(--fg-1);
          transition:
            transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
            background-color 180ms ease;
        }

        /* Open, the + turns into a × in the accent colour. */
        .item[open] .toggle {
          transform: rotate(45deg);
          background: var(--accent);
          border-color: var(--accent);
          color: var(--on-accent);
        }

        p {
          margin: 0 0 22px;
          max-width: 62ch;
          color: var(--fg-1);
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
