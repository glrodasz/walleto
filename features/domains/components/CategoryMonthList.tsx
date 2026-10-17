import { categoryIdSet } from "../../../helpers/categoryTree";
import { CategoryIcon } from "../../../components/atoms/CategoryIcon";
import { IconDisc } from "../../../components/molecules/IconDisc";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { Badge } from "../../../components/atoms/Badge";
import { ArrowRight, Chart, MoreHorizontal } from "../../../components/atoms/Icons";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { ListItem, ListItems } from "../../../components/molecules/ListItem";
import { convertedAmount, rowSign } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { plannedOccurrences } from "../helpers/months";
import { isSyntheticRow } from "../helpers/spread";
import type { MonthWindow } from "../helpers/months";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
import { gainLabel } from "../helpers/gainStack";
import type { SummaryScope } from "../helpers/worthStack";
import type { Category, Currency, Domain, RecurrentTransaction, Transaction } from "../../../types";
import { useT } from "../../../hooks/useT";
import { usePreferences } from "../../../hooks/usePreferences";
import { COMMON_MESSAGES } from "../../../messages/common";
import { DOMAIN_MESSAGES } from "../messages";

/** "gain" / "loss" for an asset; on a debt a check that came in high is "interest", low is "reduced". */
function gainKey(
  domain: Domain,
  gain: number
): "categories.interest" | "categories.reduced" | "categories.gain" | "categories.loss" {
  if (domain === "DEBT") return gain < 0 ? "categories.interest" : "categories.reduced";
  return gain > 0 ? "categories.gain" : "categories.loss";
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
  /**
   * "total": `transactions` and `gains` reach back to inception, so each row
   * is what the category holds at the end of the month — or, on a debt, what
   * it still owes, shown as a positive balance. No plan rides on a balance.
   */
  scope?: SummaryScope;
  /** Next to the title: the Month / Total switch. */
  toolbar?: ReactNode;
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
  /**
   * What the rows add up to in the currency they were recorded in, when they
   * all share one that is not the reading currency — the small figure under
   * the converted total. Absent for mixed currencies or a filed gain, which
   * has no currency of its own.
   */
  original?: { amount: number; currency: Currency };
}

/** The rows' own sum when they share one currency other than `target`. */
function originalTotal(
  rows: Transaction[],
  target: Currency
): { amount: number; currency: Currency } | undefined {
  const currency = rows[0]?.currency;
  if (!currency || currency === target || rows.some((t) => t.currency !== currency)) return;
  return { amount: rows.reduce((sum, t) => sum + rowSign(t) * t.amount, 0), currency };
}

// Kept here for existing importers; the tree helpers now live with the other
// shared helpers so charts and filters can fold children into roots too.
export { categoryIdSet };

/**
 * `gains` is what the month's value checks reported, per root category — it
 * joins the category's total, because what a holding was worth having is the
 * money put in plus what the market did to it. `sign` flips the total, so a
 * debt's running worth (negative) reads as the balance owed.
 */
export function categoryMonthRows(
  categories: Category[],
  transactions: Transaction[],
  items: RecurrentTransaction[],
  ctx: MoneyContext,
  window: MonthWindow,
  now: Date = new Date(),
  gains: Record<string, number> = {},
  sign: 1 | -1 = 1
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
      const total = sign * (mine.reduce((sum, t) => sum + convertedAmount(t, ctx), 0) + gain);
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
        original: gain === 0 ? originalTotal(mine, ctx.target) : undefined,
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
  scope = "month",
  toolbar,
}: Props) {
  const { formatAmount, formatNative } = useMoneyFormat();
  const { language } = usePreferences();
  const t = useT(DOMAIN_MESSAGES);
  const common = useT(COMMON_MESSAGES);
  const config = DOMAIN_CONFIG[domain];
  const total = scope === "total";
  // A debt's running worth is negative; the list says what is owed.
  const sign = total && domain === "DEBT" ? -1 : 1;
  const rows = useMemo(
    () =>
      categoryMonthRows(
        categories,
        transactions,
        total ? [] : items,
        ctx,
        window,
        now,
        gains,
        sign
      ),
    [categories, transactions, total, items, ctx, window, now, gains, sign]
  );
  const unfiled = sign * unfiledGain;
  const subtitle = total
    ? window.isCurrent
      ? t(domain === "DEBT" ? "worth.todayOwed" : "worth.today")
      : t(domain === "DEBT" ? "worth.endOwed" : "worth.end", { month: window.longLabel })
    : undefined;

  return (
    <Card>
      <SectionTitle title={common("noun.categories")} subtitle={subtitle}>
        {toolbar}
      </SectionTitle>

      {loading ? (
        <p className="empty">{common("state.loading")}</p>
      ) : rows.length === 0 && unfiled === 0 ? (
        <p className="empty">{t(total ? "categories.emptyTotal" : "categories.empty")}</p>
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
                      {t("categories.hidden")}
                    </Badge>
                  ) : undefined
                }
                meta={[
                  t("categories.count", { count: r.count }),
                  r.share > 0 ? t("categories.share", { share: r.share.toFixed(0) }) : null,
                  r.gain !== 0 && sign > 0
                    ? t(gainKey(domain, r.gain), {
                        amount: formatAmount(Math.abs(r.gain), currency),
                      })
                    : null,
                  r.planned > 0
                    ? t("categories.planned", { amount: formatAmount(r.planned, currency) })
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                progress={
                  !total && expected > 0
                    ? {
                        ratio: r.total / expected,
                        color: config.accent,
                        label: t("categories.landed", { name: r.category.name }),
                      }
                    : undefined
                }
                amount={formatAmount(r.total, currency)}
                amountMeta={
                  r.original
                    ? formatNative(r.original.amount, r.original.currency, currency)
                    : undefined
                }
                onClick={() => r.category.id && onSelect(r.category.id)}
                trailing={
                  <span className="actions">
                    <span className="chevron" aria-hidden="true">
                      <ArrowRight size={16} />
                    </span>
                    {onToggleHidden && (
                      <KebabMenu
                        aria-label={common("action.actionsFor", { name: r.category.name })}
                        actions={[
                          {
                            label: r.category.hiddenFromChart
                              ? t("categories.showOnChart")
                              : t("categories.hideFromChart"),
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
          {unfiled !== 0 && (
            <ListItem
              leading={
                <IconDisc domain={domain} size={36}>
                  <MoreHorizontal size={16} />
                </IconDisc>
              }
              name={gainLabel(domain, language)}
              meta={t(
                domain === "DEBT" ? "categories.unfiled.balance" : "categories.unfiled.value"
              )}
              amount={formatAmount(unfiled, currency)}
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
