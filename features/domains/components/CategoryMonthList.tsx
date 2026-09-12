import { categoryIdSet } from "../../../helpers/categoryTree";
import { CategoryIcon } from "../../../components/atoms/CategoryIcon";
import { IconDisc } from "../../../components/molecules/IconDisc";
import { useMemo } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { formatAmount } from "../../../components/atoms/Amount";
import { Badge } from "../../../components/atoms/Badge";
import { ArrowRight, Chart } from "../../../components/atoms/Icons";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { ListItem, ListItems } from "../../../components/molecules/ListItem";
import { convertedAmount } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { plannedOccurrences } from "../helpers/months";
import { isSyntheticRow } from "../helpers/spread";
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
  /** Flip the category's hiddenFromChart flag. */
  onToggleHidden?: (category: Category) => void;
}

export interface CategoryMonthRow {
  category: Category;
  total: number;
  count: number;
  share: number;
  planned: number;
}

// Kept here for existing importers; the tree helpers now live with the other
// shared helpers so charts and filters can fold children into roots too.
export { categoryIdSet };

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
        count: mine.filter((t) => !isSyntheticRow(t)).length,
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
  onToggleHidden,
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
        <ListItems>
          {rows.map((r) => {
            const expected = r.total + r.planned;
            return (
              <ListItem
                key={r.category.id}
                muted={r.category.hiddenFromChart}
                leading={
                  <IconDisc domain={domain} size={36}>
                    <CategoryIcon category={r.category} size={16} />
                  </IconDisc>
                }
                name={r.category.name}
                badges={
                  /* The bars say which "Hidden" this is: from the chart, not
                     from the dashboard. The label stays one short word — a pill
                     cannot shrink, and the kebab beside it spells the rest out. */
                  r.category.hiddenFromChart ? (
                    <Badge variant="outline" tone="warning" caps icon={<Chart size={12} />}>
                      Hidden
                    </Badge>
                  ) : undefined
                }
                meta={`${r.count} ${r.count === 1 ? "transaction" : "transactions"}${
                  r.share > 0 ? ` · ${r.share.toFixed(0)}%` : ""
                }${r.planned > 0 ? ` · ${formatAmount(r.planned, currency)} planned` : ""}`}
                progress={
                  expected > 0
                    ? {
                        ratio: r.total / expected,
                        color: config.accent,
                        label: `${r.category.name} landed`,
                      }
                    : undefined
                }
                amount={formatAmount(r.total, currency)}
                onClick={() => r.category.id && onSelect(r.category.id)}
                trailing={
                  <span className="actions">
                    <span className="chevron" aria-hidden="true">
                      <ArrowRight size={16} />
                    </span>
                    {onToggleHidden && (
                      <KebabMenu
                        aria-label={`Actions for ${r.category.name}`}
                        actions={[
                          {
                            label: r.category.hiddenFromChart ? "Show on chart" : "Hide from chart",
                            onSelect: () => onToggleHidden(r.category),
                          },
                        ]}
                      />
                    )}
                  </span>
                }
              />
            );
          })}
        </ListItems>
      )}

      <style jsx>{`
        .empty {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .actions {
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        .chevron {
          color: var(--fg-2);
          display: inline-flex;
        }
      `}</style>
    </Card>
  );
}
