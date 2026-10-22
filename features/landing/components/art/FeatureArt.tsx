import type { Language } from "../../../../types";
import { translator } from "../../../../helpers/i18n";
import { LANDING_MESSAGES } from "../../messages";
import { ArtCard } from "./ArtCard";

export type FeatureId = "plan" | "checklist" | "variable" | "currency" | "worth" | "prospect";

type T = ReturnType<typeof translator<(typeof LANDING_MESSAGES)["en"]>>;

/** What the monthly plan card boils down to: one figure left, and where the rest goes. */
function PlanArt({ t }: { t: T }) {
  return (
    <>
      <span className="art-label">{t("art.octoberBudget")}</span>
      <p className="headline">
        <span className="art-big">$1,289.17</span>
        <span className="left">{t("art.left")}</span>
      </p>
      <div className="art-tiles">
        {(
          [
            ["art.expenses", "$2,615", "var(--domain-expense)"],
            ["art.invest", "$1,120", "var(--domain-investment)"],
            ["art.debts", "$320", "var(--domain-debt)"],
          ] as const
        ).map(([label, amount, color]) => (
          <div key={label} className="art-tile">
            <span className="art-label" style={{ color }}>
              <span className="art-dot" />
              {t(label)}
            </span>
            <span className="art-num tile-value" style={{ color }}>
              {amount}
            </span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .headline {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin: 4px 0 16px;
        }

        .left {
          color: var(--domain-income);
          font-family: var(--font-mono), ui-monospace, monospace;
          font-weight: 700;
        }

        .tile-value {
          display: block;
          margin-top: 4px;
          font-weight: 700;
        }
      `}</style>
    </>
  );
}

/** The Plan view in four rows: paid, paid differently, due, overdue. */
function ChecklistArt({ t }: { t: T }) {
  const rows = [
    [t("art.rent"), "$1,450", "paid", null],
    [t("art.internet"), "$45", "paid", t("art.paidDifferent")],
    [t("art.gym"), "$30", "due", null],
    [t("art.phone"), "$25", "overdue", null],
  ] as const;
  return (
    <div className="art-rows">
      {rows.map(([name, amount, status, note]) => (
        <div key={name} className="art-row">
          <span>
            <strong>{name}</strong>
            {note && <span className="art-sub">{note}</span>}
          </span>
          <span className="end">
            <span className="art-num">{amount}</span>
            <span className={`art-status art-status--${status}`}>{t(`art.${status}`)}</span>
          </span>
        </div>
      ))}
      <style jsx>{`
        .end {
          display: inline-flex;
          align-items: center;
          gap: 16px;
        }

        .end :global(.art-status) {
          min-width: 64px;
          text-align: right;
        }
      `}</style>
    </div>
  );
}

/** Best / average / worst, and three bills as ranges with the picked point marked. */
function VariableArt({ t }: { t: T }) {
  const bills = [
    [t("art.electricity"), "$62", "$110", "$84", 46],
    [t("art.groceries"), "$380", "$560", "$470", 50],
    [t("art.fuel"), "$90", "$160", "$120", 43],
  ] as const;
  return (
    <>
      <div className="segmented">
        <span>{t("art.best")}</span>
        <span className="is-on">{t("art.average")}</span>
        <span>{t("art.worst")}</span>
      </div>
      <div className="bills">
        {bills.map(([name, floor, top, pick, at]) => (
          <div key={name} className="bill">
            <div className="bill-head">
              <strong>{name}</strong>
              <span className="art-num">{pick}</span>
            </div>
            <span className="track">
              <i style={{ left: `${at}%` }} />
            </span>
            <div className="bill-ends art-num">
              <span>{floor}</span>
              <span>{top}</span>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .segmented {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          padding: 4px;
          border-radius: 999px;
          background: var(--glass-sunken);
          font-size: 0.75rem;
          font-weight: 600;
          text-align: center;
          color: var(--fg-2);
        }

        .segmented span {
          padding: 6px 0;
          border-radius: 999px;
        }

        .segmented .is-on {
          background: var(--glass-raised);
          color: var(--fg-0);
          box-shadow: var(--shadow-sm);
        }

        .bills {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 16px;
        }

        .bill-head,
        .bill-ends {
          display: flex;
          justify-content: space-between;
        }

        .bill-ends {
          margin-top: 4px;
          color: var(--fg-2);
          font-size: 0.7rem;
        }

        .track {
          position: relative;
          display: block;
          height: 6px;
          margin-top: 8px;
          border-radius: 3px;
          background: color-mix(in srgb, var(--domain-expense) 25%, transparent);
        }

        .track i {
          position: absolute;
          top: -5px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--domain-expense);
          border: 3px solid var(--bg-0);
          box-shadow: 0 2px 6px -1px color-mix(in srgb, var(--domain-expense) 60%, transparent);
          transform: translateX(-50%);
        }
      `}</style>
    </>
  );
}

/** Rows in their own currencies, each with its converted twin, and one ≈ total. */
function CurrencyArt({ t }: { t: T }) {
  const rows = [
    [t("art.freelance"), "€2,400.00", "≈ $2,592"],
    [t("art.rent"), "MXN 18,500", "≈ $1,018"],
    [t("art.savings"), "SEK 12,000", "≈ $1,128"],
  ] as const;
  return (
    <>
      <div className="art-rows">
        {rows.map(([name, native, converted]) => (
          <div key={name} className="art-row">
            <strong>{name}</strong>
            <span className="amounts">
              <span className="art-num">{native}</span>
              <span className="art-num art-sub">{converted}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="total">
        <span className="art-label">{t("art.total")}</span>
        <span className="art-num">≈ $4,738</span>
      </div>
      <style jsx>{`
        .amounts {
          text-align: right;
        }

        .total {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-top: 12px;
          padding: 12px 4px 0;
          border-top: 1px solid var(--line);
          font-weight: 700;
          font-size: 1rem;
        }
      `}</style>
    </>
  );
}

/** Today's figure and the three parts it is made of. */
function WorthArt({ t }: { t: T }) {
  const parts = [
    [t("art.investments"), "+$31,400", "var(--domain-investment)"],
    [t("art.savings"), "+$22,810", "var(--domain-saving)"],
    [t("art.debts"), "−$6,000", "var(--domain-debt)"],
  ] as const;
  return (
    <>
      <span className="art-label">{t("art.netWorthAsOf")}</span>
      <p className="figure art-big">$48,210</p>
      <ul className="parts">
        {parts.map(([name, amount, color]) => (
          <li key={name}>
            <span>
              <span className="art-dot" style={{ color }} />
              {name}
            </span>
            <span className="art-num" style={{ color }}>
              {amount}
            </span>
          </li>
        ))}
      </ul>
      <style jsx>{`
        .figure {
          margin: 4px 0 16px;
        }

        .parts {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .parts li {
          display: flex;
          justify-content: space-between;
        }
      `}</style>
    </>
  );
}

/** Emergency mode's runway as a falling line, with a what-if underneath. */
function ProspectArt({ t }: { t: T }) {
  return (
    <>
      <span className="art-label">{t("art.emergency")}</span>
      <p className="runway">
        <span className="art-big">8.4</span>
        <span>{t("art.runway")}</span>
      </p>
      <svg className="chart" viewBox="0 0 300 100" preserveAspectRatio="none">
        <path d="M0 8 L300 92 L300 100 L0 100 Z" className="area" />
        <path d="M0 8 L300 92" className="line" />
      </svg>
      <p className="what-if">
        {t("art.whatIf")} → <span className="art-num">+$41/mo</span>
      </p>
      <style jsx>{`
        .runway {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin: 4px 0 12px;
          font-weight: 600;
        }

        .chart {
          display: block;
          width: 100%;
          height: 96px;
        }

        .area {
          fill: color-mix(in srgb, var(--accent) 14%, transparent);
        }

        .line {
          fill: none;
          stroke: var(--accent);
          stroke-width: 3;
          vector-effect: non-scaling-stroke;
        }

        .what-if {
          margin: 14px 0 0;
          padding: 8px 12px;
          border-radius: 10px;
          background: var(--accent-soft);
          color: var(--accent);
          font-size: 0.8rem;
          font-weight: 600;
        }
      `}</style>
    </>
  );
}

const ART: Record<FeatureId, (props: { t: T }) => JSX.Element> = {
  plan: PlanArt,
  checklist: ChecklistArt,
  variable: VariableArt,
  currency: CurrencyArt,
  worth: WorthArt,
  prospect: ProspectArt,
};

/** One feature's illustration, glowing in its colour and tilted away from its text. */
export function FeatureArt({
  id,
  language,
  color,
  tilt,
}: {
  id: FeatureId;
  language: Language;
  color: string;
  tilt: number;
}) {
  const Art = ART[id];
  return (
    <ArtCard glow={color} tilt={tilt}>
      <Art t={translator(LANDING_MESSAGES, language)} />
    </ArtCard>
  );
}
