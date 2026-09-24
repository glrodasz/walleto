import { categoryIdSet } from "../../../helpers/categoryTree";
import { CategoryIcon } from "../../../components/atoms/CategoryIcon";
import { IconDisc } from "../../../components/molecules/IconDisc";
import { useMemo } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { Badge } from "../../../components/atoms/Badge";
import { ArrowRight, Chart, MoreHorizontal } from "../../../components/atoms/Icons";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { ListItem, ListItems } from "../../../components/molecules/ListItem";
import { convertedAmount } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { plannedOccurrences } from "../helpers/months";
import { isSyntheticRow } from "../helpers/spread";
import type { MonthWindow } from "../helpers/months";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
import { gainLabel } from "../helpers/gainStack";
import type { Category, Currency, Domain, RecurrentTransaction, Transaction } from "../../../types";

/** "gain" / "loss" for an asset; on a debt a check that came in high is "interest", low is "reduced". */
function gainWord(domain: Domain, gain: number): string {
  if (domain === "DEBT") return gain < 0 ? "interest" : "reduced";
  return gain > 0 ? "gain" : "loss";
}

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
  /** What the month's value checks reported, per root category. */
  gains?: Record<string, number>;
  /**
   * Gain from value checks that name no category — the ones recorded before
   * the form asked. It counts toward the month, so it gets a row of its own
   * rather than quietly going missing from the list.
   */
  unfiledGain?: number;
  onSelect: (categoryId: string) => void;
  /** Flip the category's hiddenFromChart flag. */
  onToggleHidden?: (category: Category) => void;
}

export interface CategoryMonthRow {
  category: Category;
  /** Money in plus the gain filed under the category — what it is worth having held. */
  total: number;
  count: number;
  share: number;
  planned: number;
  /** The part of `total` that came from value checks, not from transactions. */
  gain: number;
}

// Kept here for existing importers; the tree helpers now live with the other
// shared helpers so charts and filters can fold children into roots too.
export { categoryIdSet };

/**
 * `gains` is what the month's value checks reported, per root category — it
 * joins the category's total, because what a holding was worth having is the
 * money put in plus what the market did to it.
 */
export function categoryMonthRows(
  categories: Category[],
  transactions: Transaction[],
  items: RecurrentTransaction[],
  ctx: MoneyContext,
  window: MonthWindow,
  now: Date = new Date(),
  gains: Record<string, number> = {}
): CategoryMonthRow[] {
  const planned = window.isCurrent
    ? plannedOccurrences(items, ctx, now, new Date(window.end.getTime() - 1))
    : [];
  const rows = categories
    .filter((c) => !c.parentId)
    .map((category) => {
      const ids = categoryIdSet(category, categories);
      const mine = transactions.filter((t) => ids.has(t.categoryId));
      const gain = category.id ? (gains[category.id] ?? 0) : 0;
      const total = mine.reduce((sum, t) => sum + convertedAmount(t, ctx), 0) + gain;
      const plannedHere = planned
        .filter((p) => ids.has(p.item.categoryId))
        .reduce((sum, p) => sum + p.amount, 0);
      return {
        category,
        total,
        count: mine.filter((t) => !isSyntheticRow(t)).length,
        share: 0,
        planned: plannedHere,
        gain,
      };
    });
  // Shares are of what came in: a category that netted out below zero
  // (withdrawals) takes none, so the others cannot read past 100%.
  const whole = rows.reduce((sum, r) => sum + Math.max(0, r.total), 0);
  return (
    rows
      .map((r) => ({ ...r, share: whole > 0 ? (Math.max(0, r.total) / whole) * 100 : 0 }))
      // A category with rows that cancelled out still has something to show.
      .filter((r) => r.count > 0 || r.total !== 0 || r.planned > 0)
      .sort((a, b) => b.total + b.planned - (a.total + a.planned))
  );
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
  gains,
  unfiledGain = 0,
  onSelect,
  onToggleHidden,
}: Props) {
  const { formatAmount } = useMoneyFormat();
  const config = DOMAIN_CONFIG[domain];
  const rows = useMemo(
    () => categoryMonthRows(categories, transactions, items, ctx, window, now, gains),
    [categories, transactions, items, ctx, window, now, gains]
  );

  return (
    <Card>
      <SectionTitle title="Categories" />

      {loading ? (
        <p className="empty">Loading…</p>
      ) : rows.length === 0 && unfiledGain === 0 ? (
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
                }${
                  r.gain !== 0
                    ? ` · ${formatAmount(Math.abs(r.gain), currency)} ${gainWord(domain, r.gain)}`
                    : ""
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
          {unfiledGain !== 0 && (
            <ListItem
              leading={
                <IconDisc domain={domain} size={36}>
                  <MoreHorizontal size={16} />
                </IconDisc>
              }
              name={gainLabel(domain)}
              meta={`From ${domain === "DEBT" ? "balance" : "value"} checks that name no category`}
              amount={formatAmount(unfiledGain, currency)}
            />
          )}
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
