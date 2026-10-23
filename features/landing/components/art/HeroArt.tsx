import type { Language } from "../../../../types";
import { translator } from "../../../../helpers/i18n";
import { LANDING_MESSAGES } from "../../messages";
import { ArtCard } from "./ArtCard";

const BARS = [38, 62, 46, 74, 52, 66, 80];

/**
 * The hero's picture of the app: the dashboard's "left to allocate" with a
 * cash-flow sparkline, and a phone showing the month's checklist. Drawn, not
 * captured, so it stays crisp and speaks the page's language.
 */
export function HeroArt({ language, label }: { language: Language; label: string }) {
  const t = translator(LANDING_MESSAGES, language);
  return (
    <div className="hero-art" role="img" aria-label={label}>
      <ArtCard className="board" tilt={-2}>
        <p className="greeting">{t("art.greeting")}</p>
        <p className="art-label">{t("art.month")}</p>
        <div className="allocate">
          <span className="art-label">{t("art.leftToAllocate")}</span>
          <span className="art-big">$1,334.17</span>
          <span className="split" aria-hidden="true">
            <i style={{ flex: 41, background: "var(--domain-expense)" }} />
            <i style={{ flex: 10, background: "var(--domain-investment)" }} />
            <i style={{ flex: 10, background: "var(--domain-saving)" }} />
            <i style={{ flex: 18, background: "var(--domain-debt)" }} />
            <i style={{ flex: 21, background: "var(--line-strong)" }} />
          </span>
        </div>
        <div className="art-tiles two">
          <div className="art-tile">
            <span className="art-label" style={{ color: "var(--domain-income)" }}>
              <span className="art-dot" />
              {t("art.income")}
            </span>
            <span className="art-num value" style={{ color: "var(--domain-income)" }}>
              $6,363.63
            </span>
          </div>
          <div className="art-tile">
            <span className="art-label" style={{ color: "var(--domain-expense)" }}>
              <span className="art-dot" />
              {t("art.expenses")}
            </span>
            <span className="art-num value" style={{ color: "var(--domain-expense)" }}>
              $2,615.84
            </span>
          </div>
        </div>
        <div className="bars">
          {BARS.map((h, i) => (
            <i key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
      </ArtCard>

      <div className="phone">
        <div className="screen">
          <span className="notch" />
          <p className="phone-title">{t("art.thisMonth")}</p>
          <div className="worth">
            <span className="art-label">{t("art.netWorthToday")}</span>
            <span className="art-num">$48,210</span>
          </div>
          <ul className="list">
            {(
              [
                [t("art.rent"), "$1,450", "paid"],
                [t("art.electricity"), "$62–110", "due"],
                ["Spotify", "€10.99", "overdue"],
                [t("art.carLoan"), "$320", "paid"],
              ] as const
            ).map(([name, amount, status]) => (
              <li key={name}>
                <span>
                  <strong>{name}</strong>
                  <span className="art-num amount">{amount}</span>
                </span>
                <span className={`status status--${status}`}>{t(`art.${status}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style jsx>{`
        .hero-art {
          position: relative;
          padding: 24px 0 40px;
        }

        .hero-art :global(.board) {
          width: 82%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .greeting {
          margin: 0;
          font-weight: 700;
          font-size: 1rem;
        }

        .greeting + :global(.art-label) {
          margin: -10px 0 0;
        }

        .allocate {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 14px;
          border-radius: 14px;
          background: var(--glass-strong);
          border: 1px solid var(--line);
        }

        .split {
          display: flex;
          gap: 3px;
          height: 6px;
          margin-top: 8px;
        }

        .split i {
          border-radius: 3px;
        }

        .two {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .value {
          display: block;
          margin-top: 4px;
          font-weight: 700;
          font-size: 1rem;
        }

        .bars {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 72px;
          padding: 10px 12px 0;
          border-radius: 14px;
          background: var(--glass-strong);
          border: 1px solid var(--line);
        }

        .bars i {
          flex: 1;
          border-radius: 4px 4px 0 0;
          background: color-mix(in srgb, var(--domain-income) 55%, transparent);
        }

        .phone {
          position: absolute;
          right: 0;
          top: 0;
          width: 44%;
          min-width: 220px;
          padding: 10px;
          border-radius: 36px;
          background: #0b1020;
          box-shadow: 0 40px 70px -30px rgba(15, 23, 42, 0.55);
          transform: rotate(2deg);
        }

        .screen {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px 12px 16px;
          border-radius: 28px;
          background: var(--bg-0);
          color: var(--fg-0);
          font-size: 0.8rem;
        }

        .notch {
          align-self: center;
          width: 38%;
          height: 18px;
          border-radius: 10px;
          background: #0b1020;
        }

        .phone-title {
          margin: 4px 0 0;
          font-weight: 700;
        }

        .worth {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 12px;
          border-radius: 14px;
          background: var(--glass-raised);
        }

        .worth .art-num {
          font-size: 1.15rem;
          font-weight: 700;
        }

        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .list li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 12px;
          background: var(--glass-raised);
        }

        .list strong {
          display: block;
          font-weight: 600;
        }

        .amount {
          color: var(--fg-1);
          font-size: 0.72rem;
          font-family: var(--font-mono), ui-monospace, monospace;
        }

        .status {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* Mixed toward the text colour, so the small labels stay readable (4.5:1). */
        .status--paid {
          color: color-mix(in srgb, var(--domain-income) 70%, var(--fg-0));
        }

        .status--due {
          color: color-mix(in srgb, var(--domain-saving) 55%, var(--fg-0));
        }

        .status--overdue {
          color: color-mix(in srgb, var(--domain-expense) 70%, var(--fg-0));
        }

        /* On a phone the board would be too small to read: the phone alone tells it. */
        @media (max-width: 699px) {
          .hero-art {
            padding: 0;
            display: flex;
            justify-content: center;
          }

          .hero-art :global(.board) {
            display: none;
          }

          .phone {
            position: relative;
            width: 72%;
            max-width: 280px;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
