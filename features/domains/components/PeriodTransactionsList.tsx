import { useMemo } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { formatAmount } from "../../../components/atoms/Amount";
import { TransactionRow } from "../../../components/molecules/TransactionRow";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import type { MoneyContext } from "../../../helpers/aggregations";
import { groupByDay } from "../helpers/months";
import { tagNames } from "../../../helpers/tags";
import { FREQUENCY_LABELS } from "../../../constants";
import type { Currency, RecurrentTransaction, Tag, Transaction } from "../../../types";

interface Props {
  title: string;
  /** Already scoped to the month (and, in a drilldown, the category). */
  transactions: Transaction[];
  displayCurrency: Currency;
  ctx: MoneyContext;
  /** The user's tags, to name a row's tag ids. */
  tags?: Tag[];
  /** The domain's recurring items, to say which one wrote a row. */
  items?: RecurrentTransaction[];
  loading?: boolean;
  onEdit?: (transaction: Transaction) => void;
  /** Rows written by a hidden recurring item (or a hidden category) get a pill and dim. */
  isHidden?: (transaction: Transaction) => boolean;
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
  tags = [],
  items = [],
  loading,
  onEdit,
  isHidden,
  onDelete,
  deletingId,
  limit = 60,
  now,
}: Props) {
  const groups = useMemo(() => groupByDay(transactions, ctx, now), [transactions, ctx, now]);

  // "recurring · Monthly", plus the item's name when the row was renamed;
  // a stopped item no longer resolves, so the row just says "recurring".
  const origin = (t: Transaction) => {
    if (!t.recurrentTransactionId) return "one-off";
    const item = items.find((i) => i.id === t.recurrentTransactionId);
    if (!item) return "recurring";
    return `recurring · ${FREQUENCY_LABELS[item.frequency]}${
      item.name !== t.name ? ` · ${item.name}` : ""
    }`;
  };

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
                  charged={
                    t.chargedAmount !== undefined && t.chargedCurrency
                      ? { amount: t.chargedAmount, currency: t.chargedCurrency }
                      : undefined
                  }
                  meta={origin(t)}
                  tags={isHidden?.(t) ? ["Hidden"] : undefined}
                  labels={tagNames(t.tags, tags)}
                  note={t.note}
                  muted={Boolean(isHidden?.(t))}
                  trailing={
                    <KebabMenu
                      aria-label={`Actions for ${t.name}`}
                      actions={[
                        ...(onEdit ? [{ label: "Edit", onSelect: () => onEdit(t) }] : []),
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
          margin: 10px 0 0;
          font-size: 0.75rem;
          color: var(--fg-2);
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
