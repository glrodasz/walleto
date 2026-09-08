import { useMemo } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { formatAmount } from "../../../components/atoms/Amount";
import { useAllInvestmentValuations } from "../../../hooks/useInvestmentValuations";
import type { Category, InvestmentValuation } from "../../../types";

interface Props {
  categories: Category[];
  /** [start, end) of the month shown. */
  start: Date;
  end: Date;
}

const DATE = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

export function valuationsInWindow(
  valuations: InvestmentValuation[],
  start: Date,
  end: Date
): InvestmentValuation[] {
  return valuations.filter((v) => {
    const d = v.asOf.toDate();
    return d >= start && d < end;
  });
}

/**
 * The month's value checks next to its transactions. They are statements,
 * not money moving, so they never count toward totals — they are listed so
 * the ledger tells the whole story of the month.
 */
export function ValuationRows({ categories, start, end }: Props) {
  const { valuations } = useAllInvestmentValuations();
  const rows = useMemo(() => valuationsInWindow(valuations, start, end), [valuations, start, end]);
  if (rows.length === 0) return null;

  return (
    <Card>
      <SectionTitle title="Value checks" />
      <p className="note">Statements of value, not money moving — not counted in totals.</p>
      <ul className="list">
        {rows.map((v) => (
          <li key={v.id} className="row">
            <span className="main">
              <span className="name">
                {categories.find((c) => c.id === v.categoryId)?.name ?? "Investment"}
              </span>
              <span className="meta">
                {DATE.format(v.asOf.toDate())} · value check
                {v.note ? ` · ${v.note}` : ""}
              </span>
            </span>
            <span className="right">
              <span className="amount">{formatAmount(v.value, v.currency)}</span>
              <span className={`gain ${v.gainPct >= 0 ? "up" : "down"}`}>
                {v.gainPct >= 0 ? "+" : ""}
                {v.gainPct.toFixed(1)}%
              </span>
            </span>
          </li>
        ))}
      </ul>

      <style jsx>{`
        .note {
          margin: -4px 0 10px;
          font-size: 0.75rem;
          color: var(--fg-2);
        }

        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .name {
          font-size: 0.85rem;
          color: var(--fg-1);
        }

        .meta {
          font-size: 0.72rem;
          color: var(--fg-2);
        }

        .right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1px;
        }

        .amount {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--fg-0);
        }

        .gain {
          font-size: 0.72rem;
        }

        .up {
          color: var(--accent);
        }

        .down {
          color: var(--accent-hot);
        }
      `}</style>
    </Card>
  );
}
