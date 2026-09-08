import { useEffect, useRef } from "react";
import { Amount, formatAmount } from "../../../components/atoms/Amount";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
import type { MonthWindow } from "../helpers/months";
import type { Currency, Domain } from "../../../types";

interface Props {
  domain: Domain;
  windows: MonthWindow[];
  selectedKey: string;
  onSelect: (key: string) => void;
  /** What landed in the selected month, converted. */
  realized: number;
  /** realized + still planned for the month in progress; realized otherwise. */
  expected: number;
  /** Mean of the finished months, or null with no history. */
  average: number | null;
  currency: Currency;
  approximate?: boolean;
}

const MONTH_NAME = new Intl.DateTimeFormat("en", { month: "long" });

/**
 * The month picker and the month's verdict: what landed, how much of the
 * expected total that is, what the plan still owes, and how it compares
 * with a normal month.
 */
export function MonthHeader({
  domain,
  windows,
  selectedKey,
  onSelect,
  realized,
  expected,
  average,
  currency,
  approximate,
}: Props) {
  const config = DOMAIN_CONFIG[domain];
  const window = windows.find((w) => w.key === selectedKey) ?? windows[windows.length - 1];
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Keep the selected chip in view on phones; jsdom has no scrollIntoView.
    selectedRef.current?.scrollIntoView?.({ inline: "center", block: "nearest" });
  }, [selectedKey]);

  const planned = Math.max(0, expected - realized);
  const pct = expected > 0 ? Math.min(100, (realized / expected) * 100) : 0;
  const compareTo = window.isCurrent ? expected : realized;
  const diffPct = average && average > 0 ? ((compareTo - average) / average) * 100 : null;
  const above = (diffPct ?? 0) > 0;
  const good = above === config.upIsGood;

  return (
    <div className="header">
      <div className="months" role="tablist" aria-label="Month">
        {windows.map((w) => {
          const selected = w.key === selectedKey;
          return (
            <button
              key={w.key}
              ref={selected ? selectedRef : undefined}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`month${selected ? " is-selected" : ""}${w.isCurrent ? " is-current" : ""}`}
              onClick={() => onSelect(w.key)}
            >
              {w.label}
            </button>
          );
        })}
      </div>

      <span className="label">
        {config.spentLabel} in {MONTH_NAME.format(window.start)}
        {window.isCurrent ? " so far" : ""}
      </span>
      <div className="figure">
        <Amount value={realized} currency={currency} size="lg" approximate={approximate} />
      </div>

      {expected > 0 && (
        <div
          className="bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-label={`${config.spentLabel} of expected`}
        >
          <span className="fill" style={{ width: `${pct}%` }} />
        </div>
      )}

      <p className="line">
        {window.isCurrent ? (
          planned > 0 ? (
            <>
              <strong>{formatAmount(planned, currency)}</strong> still planned · expected{" "}
              <strong>{formatAmount(expected, currency)}</strong>
            </>
          ) : (
            <>Nothing more planned this month</>
          )
        ) : (
          <>Month total</>
        )}
        {diffPct !== null && average !== null && (
          <>
            {" · "}
            <span className={good ? "good" : "bad"}>
              {Math.abs(diffPct).toFixed(0)}% {above ? "above" : "below"}
            </span>{" "}
            your average of {formatAmount(average, currency)}
          </>
        )}
      </p>

      <style jsx>{`
        .header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .months {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
          margin: 0 -16px 4px;
          padding-left: 16px;
          padding-right: 16px;
          scrollbar-width: none;
          scroll-snap-type: x proximity;
        }

        .months::-webkit-scrollbar {
          display: none;
        }

        .month {
          flex-shrink: 0;
          min-width: 52px;
          min-height: 36px;
          padding: 6px 12px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: var(--bg-2);
          color: var(--fg-2);
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          scroll-snap-align: center;
        }

        .month.is-current {
          border-style: dashed;
        }

        .month.is-selected {
          background: ${config.accent};
          border-color: ${config.accent};
          color: #0a0a0f;
        }

        .label {
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .figure {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .bar {
          height: 8px;
          border-radius: 999px;
          background: var(--bg-3);
          overflow: hidden;
        }

        .fill {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: ${config.accent};
          transition: width 0.3s ease;
        }

        .line {
          margin: 0;
          font-size: 0.82rem;
          color: var(--fg-2);
        }

        .line strong {
          color: var(--fg-0);
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }

        .good {
          color: var(--accent);
        }

        .bad {
          color: var(--accent-hot);
        }

        @media (min-width: 768px) {
          .months {
            margin: 0 0 4px;
            padding-left: 0;
            padding-right: 0;
          }
        }
      `}</style>
    </div>
  );
}
