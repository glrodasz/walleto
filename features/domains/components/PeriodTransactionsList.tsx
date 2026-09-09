import { useMemo } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { formatAmount } from "../../../components/atoms/Amount";
import { TransactionRow } from "../../../components/molecules/TransactionRow";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import type { MoneyContext } from "../../../helpers/aggregations";
import { groupByDay } from "../helpers/months";
import type { Currency, Transaction } from "../../../types";

interface Props {
  title: string;
  /** Already scoped to the month (and, in a drilldown, the category). */
  transactions: Transaction[];
  displayCurrency: Currency;
  ctx: MoneyContext;
  loading?: boolean;
  onEdit?: (transaction: Transaction) => void;
  /** Flip the row's hiddenFromDashboard flag. */
  onToggleHidden?: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  deletingId: string | null;
  /** Rows shown before the "and N more" line. A month is bounded; 60 covers it. */
  limit?: number;
  now?: Date;
}

/**
 * What actually happened, grouped by day with a daily subtotal, newest
 * first — including the rows the materializer wrote for recurring items.
 * Deleting one skips that single occurrence; the plan lives under Recurring.
 */
export function PeriodTransactionsList({
  title,
  transactions,
  displayCurrency,
  ctx,
  loading,
  onEdit,
  onToggleHidden,
  onDelete,
  deletingId,
  limit = 60,
  now,
}: Props) {
  const groups = useMemo(() => groupByDay(transactions, ctx, now), [transactions, ctx, now]);

  // Cap by rows, keeping whole days intact where possible.
  const { shown, hidden } = useMemo(() => {
    let remaining = limit;
    const kept = [];
    for (const g of groups) {
      if (remaining <= 0) break;
      const rows = g.rows.slice(0, remaining);
      kept.push({ ...g, rows });
      remaining -= rows.length;
    }
    const shownCount = kept.reduce((n, g) => n + g.rows.length, 0);
    return { shown: kept, hidden: transactions.length - shownCount };
  }, [groups, limit, transactions.length]);

  return (
    <Card>
      <SectionTitle title={title} />

      {loading ? (
        <p className="empty">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="empty">Nothing recorded in this period</p>
      ) : (
        shown.map((g) => (
          <section key={g.key} className="day">
            <h3 className="day-head">
              <span>{g.label}</span>
              <span className="day-total">{formatAmount(g.total, displayCurrency)}</span>
            </h3>
            <ul className="list">
              {g.rows.map((t) => (
                <TransactionRow
                  key={t.id}
                  name={t.name}
                  amount={t.amount}
                  currency={t.currency}
                  displayCurrency={displayCurrency}
                  meta={t.recurrentTransactionId ? "recurring" : "one-off"}
                  tags={t.hiddenFromDashboard ? ["Hidden on dashboard"] : undefined}
                  muted={Boolean(t.hiddenFromDashboard)}
                  trailing={
                    <KebabMenu
                      aria-label={`Actions for ${t.name}`}
                      actions={[
                        ...(onEdit ? [{ label: "Edit", onSelect: () => onEdit(t) }] : []),
                        ...(onToggleHidden
                          ? [
                              {
                                label: t.hiddenFromDashboard
                                  ? "Show on dashboard"
                                  : "Hide from dashboard",
                                onSelect: () => onToggleHidden(t),
                              },
                            ]
                          : []),
                        {
                          label: deletingId === t.id ? "Deleting…" : "Delete",
                          onSelect: () => t.id && onDelete(t.id),
                          danger: true,
                          disabled: deletingId === t.id,
                        },
                      ]}
                    />
                  }
                />
              ))}
            </ul>
          </section>
        ))
      )}

      {hidden > 0 && <p className="more">and {hidden} more in this period</p>}

      <style jsx>{`
        .empty,
        .more {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .more {
          margin-top: 10px;
          font-size: 0.75rem;
        }

        .day {
          margin-bottom: 12px;
        }

        .day:last-of-type {
          margin-bottom: 0;
        }

        .day-head {
          display: flex;
          justify-content: space-between;
          margin: 0 0 8px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--fg-2);
        }

        .day-total {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          letter-spacing: 0;
          text-transform: none;
        }

        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      `}</style>
    </Card>
  );
}
