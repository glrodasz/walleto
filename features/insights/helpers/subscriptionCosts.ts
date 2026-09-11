import { toMonthlyAmount } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import type { Category, RecurrentTransaction, Timestamp } from "../../../types";

/**
 * A recurrent item counts as a subscription if it's explicitly typed as one,
 * or its category is the "Subscriptions" default — the wizard's quick-add
 * flow leaves `type` unset (falls to OTHER), so category is the fallback
 * signal rather than a hard requirement.
 */
export function isSubscription(
  item: Pick<RecurrentTransaction, "type" | "categoryId">,
  categories: Pick<Category, "id" | "name">[]
): boolean {
  if (item.type === "SUBSCRIPTION") return true;
  const category = categories.find((c) => c.id === item.categoryId);
  return category?.name.trim().toLowerCase() === "subscriptions";
}

export interface SubscriptionCost {
  id: string;
  name: string;
  monthlyAmount: number;
  annualizedAmount: number;
  nextOccurrence: Date | null;
  /** chargedCurrency per unit of currency, when the item records a charged pair. */
  impliedRate: number | null;
}

export interface SubscriptionCostsSummary {
  items: SubscriptionCost[];
  totalMonthly: number;
  totalAnnualized: number;
  /** null when monthly income is zero or unknown — a % of nothing is meaningless. */
  percentOfIncome: number | null;
}

/**
 * Per-subscription monthly/annualized cost (converted, sorted priciest
 * first) plus portfolio totals. `incomeMonthly` should already be converted
 * into the same reporting currency as `ctx.target`.
 */
export function subscriptionCosts(
  items: RecurrentTransaction[],
  categories: Pick<Category, "id" | "name">[],
  ctx: MoneyContext,
  incomeMonthly: number = 0
): SubscriptionCostsSummary {
  const subs = items.filter((item) => isSubscription(item, categories));

  const costs: SubscriptionCost[] = subs
    .map((item) => {
      const monthlyAmount = toMonthlyAmount(item, ctx);
      const impliedRate =
        item.chargedAmount !== undefined && item.chargedCurrency
          ? item.chargedAmount / item.amount
          : null;

      return {
        id: item.id ?? "",
        name: item.name,
        monthlyAmount,
        annualizedAmount: monthlyAmount * 12,
        nextOccurrence: toDateOrNull(item.nextOccurrence),
        impliedRate,
      };
    })
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount);

  const totalMonthly = costs.reduce((sum, c) => sum + c.monthlyAmount, 0);

  return {
    items: costs,
    totalMonthly,
    totalAnnualized: totalMonthly * 12,
    percentOfIncome: incomeMonthly > 0 ? (totalMonthly / incomeMonthly) * 100 : null,
  };
}

function toDateOrNull(ts: Timestamp | undefined): Date | null {
  return ts ? ts.toDate() : null;
}
