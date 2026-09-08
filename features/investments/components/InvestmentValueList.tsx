import { useMemo, useState } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { Button } from "../../../components/atoms/Button";
import { formatAmount } from "../../../components/atoms/Amount";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useAllInvestmentValuations } from "../../../hooks/useInvestmentValuations";
import { convert } from "../../../helpers/fx";
import type { MoneyContext } from "../../../helpers/aggregations";
import { costBasisAt, gainFromValue } from "../helpers/valuation";
import { RecordValueModal } from "./RecordValueModal";
import type { Category, Currency } from "../../../types";

interface Props {
  categories: Category[];
  ctx: MoneyContext;
  currency: Currency;
  /** Opens the category's full valuation panel. */
  onOpen: (categoryId: string) => void;
}

const INCEPTION = new Date(2000, 0, 1);
const DATE = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

/**
 * Every investment category at a glance: what went in, what it is worth
 * according to the latest value check, and the gain. Mounted only on the
 * Investments page's Value view, so its inception-to-date listener runs
 * nowhere else.
 */
export function InvestmentValueList({ categories, ctx, currency, onOpen }: Props) {
  const { transactions, loading: txLoading } = useDomainTransactions("INVESTMENT", INCEPTION);
  const { valuations, loading, error } = useAllInvestmentValuations();
  const [recordFor, setRecordFor] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);

  const rows = useMemo(
    () =>
      categories
        .filter((c) => !c.parentId && c.id)
        .map((c) => {
          const invested = costBasisAt(transactions, c.id!, now, ctx);
          const latest = valuations.find((v) => v.categoryId === c.id) ?? null;
          const value = latest
            ? convert(latest.value, latest.currency, currency, ctx.rates)
            : invested;
          return { category: c, invested, latest, value, gainPct: gainFromValue(invested, value) };
        })
        .filter((r) => r.invested > 0 || r.latest)
        .sort((a, b) => b.value - a.value),
    [categories, transactions, valuations, now, ctx, currency]
  );

  return (
    <Card accentColor="var(--domain-investment)">
      <SectionTitle title="Value" />
      {error && <ErrorState error={error} />}

      {txLoading || loading ? (
        <p className="empty">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="empty">Nothing invested yet</p>
      ) : (
        <ul className="list">
          {rows.map((r) => (
            <li key={r.category.id} className="row">
              <button type="button" className="main" onClick={() => onOpen(r.category.id!)}>
                <span className="name">{r.category.name}</span>
                <span className="meta">
                  Invested {formatAmount(r.invested, currency)}
                  {r.latest
                    ? ` · valued ${DATE.format(r.latest.asOf.toDate())}`
                    : " · no value check yet"}
                </span>
              </button>
              <span className="right">
                <span className="amount">{formatAmount(r.value, currency)}</span>
                {r.gainPct !== null && (
                  <span className={`gain ${r.value - r.invested >= 0 ? "up" : "down"}`}>
                    {r.value - r.invested >= 0 ? "+" : ""}
                    {r.gainPct.toFixed(1)}%
                  </span>
                )}
              </span>
              <Button size="sm" onClick={() => setRecordFor(r.category.id!)}>
                Record value
              </Button>
            </li>
          ))}
        </ul>
      )}

      {recordFor && (
        <RecordValueModal open categoryId={recordFor} onClose={() => setRecordFor(null)} />
      )}

      <style jsx>{`
        .empty {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }

        .row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--line);
        }

        .row:last-child {
          border-bottom: none;
        }

        .main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
          border: none;
          background: transparent;
          color: inherit;
          font-family: inherit;
          text-align: left;
          padding: 0;
          cursor: pointer;
        }

        .name {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--fg-0);
        }

        .meta {
          font-size: 0.72rem;
          color: var(--fg-2);
        }

        .right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
        }

        .amount {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.9rem;
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
