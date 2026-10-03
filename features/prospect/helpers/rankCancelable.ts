import { toMonthlyAmount } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { essentialIsGuessed, isEssential } from "../../../helpers/essential";
import type { Category, RecurrentTransaction } from "../../../types";

export interface RankedItem {
  item: RecurrentTransaction;
  /** Monthly run-rate in ctx.target. */
  monthly: number;
  essential: boolean;
  /** The essential flag is a guess the owner hasn't confirmed. */
  guessed: boolean;
}

/**
 * The plan's outgoing items, sorted into what Prospect asks about each:
 * spending that could go, spending that has to stay, contributions that can
 * be paused, and repayments that can't. Each group is priciest first, so the
 * top of `nonEssential` is the biggest saving on offer.
 */
export interface CancelableGroups {
  nonEssential: RankedItem[];
  essential: RankedItem[];
  /** INVESTMENT and SAVING contributions. */
  contributions: RankedItem[];
  debts: RankedItem[];
}

const byMonthlyDesc = (a: RankedItem, b: RankedItem) =>
  b.monthly - a.monthly || a.item.name.localeCompare(b.item.name);

export function rankCancelable(
  items: RecurrentTransaction[],
  categories: Pick<Category, "id" | "name">[],
  ctx: MoneyContext
): CancelableGroups {
  const groups: CancelableGroups = {
    nonEssential: [],
    essential: [],
    contributions: [],
    debts: [],
  };
  for (const item of items) {
    if (item.domain === "INCOME") continue;
    const ranked: RankedItem = {
      item,
      monthly: toMonthlyAmount(item, ctx),
      essential: isEssential(item, categories),
      guessed: essentialIsGuessed(item),
    };
    if (item.domain === "DEBT") groups.debts.push(ranked);
    else if (item.domain !== "EXPENSE") groups.contributions.push(ranked);
    else if (ranked.essential) groups.essential.push(ranked);
    else groups.nonEssential.push(ranked);
  }
  groups.nonEssential.sort(byMonthlyDesc);
  groups.essential.sort(byMonthlyDesc);
  groups.contributions.sort(byMonthlyDesc);
  groups.debts.sort(byMonthlyDesc);
  return groups;
}

/** The `n` priciest non-essential items — "what if I cancel my top 3?". */
export function topNonEssentialIds(groups: CancelableGroups, n: number): string[] {
  return groups.nonEssential
    .slice(0, n)
    .map((r) => r.item.id)
    .filter((id): id is string => Boolean(id));
}
