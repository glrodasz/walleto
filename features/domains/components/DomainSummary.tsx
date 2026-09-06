import { Amount, formatAmount } from "../../../components/atoms/Amount";
import { PERIODS } from "../helpers/periods";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
import type { Currency, Domain } from "../../../types";

interface Props {
  domain: Domain;
  /** Converted sum of realized transactions in the period — matches the chart and the delta. */
  periodTotal: number;
  /** Monthly run-rate of the active recurrent plans. */
  runRate: number;
  currency: Currency;
  deltaPct: number;
  approximate?: boolean;
  periodIdx: number;
  onPeriodChange: (index: number) => void;
}

/**
 * The KPI header of a domain page: the period's realized total (big figure,
 * one data source with the chart below it) with the planned monthly run-rate
 * as a second line — two different questions, two labeled numbers.
 */
export function DomainSummary({
  domain,
  periodTotal,
  runRate,
  currency,
  deltaPct,
  approximate = false,
  periodIdx,
  onPeriodChange,
}: Props) {
  const config = DOMAIN_CONFIG[domain];
  const hasDelta = deltaPct !== 0;
  const up = deltaPct > 0;
  const good = up === config.upIsGood;

  return (
    <div className="summary-row">
      <div>
        <span className="summary-label">{config.totalLabel}</span>
        <div className="summary-amount">
          <Amount value={periodTotal} currency={currency} size="lg" approximate={approximate} />
          {hasDelta && (
            <span className={`delta-badge ${good ? "good" : "bad"}`}>
              {up ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(0)}%
            </span>
          )}
          {hasDelta && <span className="delta-note">vs same point last month</span>}
        </div>
        <span className="run-rate">
          {config.runRateLabel}: <strong>{formatAmount(runRate, currency)}</strong>/mo
        </span>
      </div>

      <div className="period-tabs">
        {PERIODS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            className={`period-btn${i === periodIdx ? " active" : ""}`}
            onClick={() => onPeriodChange(i)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <style jsx>{`
        .summary-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .summary-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--fg-2);
          margin-bottom: 6px;
        }

        .summary-amount {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .run-rate {
          display: block;
          margin-top: 6px;
          font-size: 0.8rem;
          color: var(--fg-2);
        }

        .run-rate strong {
          color: var(--fg-1);
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
        }

        .delta-note {
          font-size: 0.72rem;
          color: var(--fg-2);
          white-space: nowrap;
        }

        .delta-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 999px;
        }

        .delta-badge.bad {
          background: rgba(255, 61, 104, 0.12);
          color: var(--accent-hot);
        }

        .delta-badge.good {
          background: rgba(124, 255, 178, 0.12);
          color: var(--accent);
        }

        .period-tabs {
          display: flex;
          gap: 2px;
          background: var(--bg-2);
          border-radius: var(--r-sm);
          padding: 3px;
          align-self: flex-start;
        }

        .period-btn {
          padding: 5px 12px;
          border-radius: calc(var(--r-sm) - 2px);
          border: none;
          background: transparent;
          color: var(--fg-2);
          font-size: 0.8rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition:
            background 0.15s,
            color 0.15s;
        }

        .period-btn.active {
          background: var(--bg-3);
          color: var(--fg-0);
        }
      `}</style>
    </div>
  );
}
