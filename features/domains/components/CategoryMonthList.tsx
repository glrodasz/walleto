import { useMemo } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { formatAmount } from "../../../components/atoms/Amount";
import { ArrowRight } from "../../../components/atoms/Icons";
import { convertedAmount } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { plannedOccurrences } from "../helpers/months";
import type { MonthWindow } from "../helpers/months";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
import type { Category, Currency, Domain, RecurrentTransaction, Transaction } from "../../../types";

interface Props {
  domain: Domain;
  categories: Category[];
  /** The selected month's transactions, all categories. */
  transactions: Transaction[];
  /** The domain's active items, for the still-planned share of the month in progress. */
  items: RecurrentTransaction[];
  ctx: MoneyContext;
  currency: Currency;
  window: MonthWindow;
  now?: Date;
  loading?: boolean;
  onSelect: (categoryId: string) => void;
}

export interface CategoryMonthRow {
  category: Category;
  total: number;
  count: number;
  share: number;
  planned: number;
}

/** A root category owns its own id plus every child's. */
export function categoryIdSet(root: Category, categories: Category[]): Set<string> {
  const ids = new Set<string>();
  if (root.id) ids.add(root.id);
  for (const c of categories) if (c.id && c.parentId === root.id) ids.add(c.id);
  return ids;
}

export function categoryMonthRows(
  categories: Category[],
  transactions: Transaction[],
  items: RecurrentTransaction[],
  ctx: MoneyContext,
  window: MonthWindow,
  now: Date = new Date()
): CategoryMonthRow[] {
  const planned = window.isCurrent
    ? plannedOccurrences(items, ctx, now, new Date(window.end.getTime() - 1))
    : [];
  const monthTotal = transactions.reduce((sum, t) => sum + convertedAmount(t, ctx), 0);

  return categories
    .filter((c) => !c.parentId)
    .map((category) => {
      const ids = categoryIdSet(category, categories);
      const mine = transactions.filter((t) => ids.has(t.categoryId));
      const total = mine.reduce((sum, t) => sum + convertedAmount(t, ctx), 0);
      const plannedHere = planned
        .filter((p) => ids.has(p.item.categoryId))
        .reduce((sum, p) => sum + p.amount, 0);
      return {
        category,
        total,
        count: mine.length,
        share: monthTotal > 0 ? (total / monthTotal) * 100 : 0,
        planned: plannedHere,
      };
    })
    .filter((r) => r.total > 0 || r.planned > 0)
    .sort((a, b) => b.total + b.planned - (a.total + a.planned));
}

/**
 * The month by category: total, count, share and — for the month in
 * progress — how much of the category's expected amount has landed.
 */
export function CategoryMonthList({
  domain,
  categories,
  transactions,
  items,
  ctx,
  currency,
  window,
  now,
  loading,
  onSelect,
}: Props) {
  const config = DOMAIN_CONFIG[domain];
  const rows = useMemo(
    () => categoryMonthRows(categories, transactions, items, ctx, window, now),
    [categories, transactions, items, ctx, window, now]
  );

  return (
    <Card>
      <SectionTitle title="Categories" />

      {loading ? (
        <p className="empty">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="empty">Nothing in this month yet</p>
      ) : (
        <ul className="list">
          {rows.map((r) => {
            const expected = r.total + r.planned;
            const pct = expected > 0 ? Math.min(100, (r.total / expected) * 100) : 0;
            return (
              <li key={r.category.id}>
                <button
                  type="button"
                  className="row"
                  onClick={() => r.category.id && onSelect(r.category.id)}
                >
                  <span className="main">
                    <span className="name">{r.category.name}</span>
                    <span className="meta">
                      {r.count} {r.count === 1 ? "transaction" : "transactions"}
                      {r.share > 0 ? ` · ${r.share.toFixed(0)}%` : ""}
                      {r.planned > 0 ? ` · ${formatAmount(r.planned, currency)} planned` : ""}
                    </span>
                    {expected > 0 && (
                      <span className="mini">
                        <span className="mini-fill" style={{ width: `${pct}%` }} />
                      </span>
                    )}
                  </span>
                  <span className="amount">{formatAmount(r.total, currency)}</span>
                  <span className="chevron" aria-hidden="true">
                    <ArrowRight size={16} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
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
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border: none;
          border-bottom: 1px solid var(--line);
          background: transparent;
          color: inherit;
          font-family: inherit;
          text-align: left;
          cursor: pointer;
        }

        li:last-child .row {
          border-bottom: none;
        }

        .main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
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

        .mini {
          display: block;
          height: 4px;
          max-width: 180px;
          border-radius: 999px;
          background: var(--bg-3);
          overflow: hidden;
        }

        .mini-fill {
          display: block;
          height: 100%;
          background: ${config.accent};
        }

        .amount {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--fg-0);
          white-space: nowrap;
        }

        .chevron {
          color: var(--fg-2);
          display: inline-flex;
        }
      `}</style>
    </Card>
  );
}
