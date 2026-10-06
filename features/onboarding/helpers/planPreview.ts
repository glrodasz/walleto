import { toMonthlyAmount } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import type { Currency, RecurrentTransaction } from "../../../types";
import { CADENCE_SECTIONS, sectionFor } from "./cadenceSections";

/**
 * The Review step's list order: the way the wizard grouped them (monthly,
 * then yearly, other cadences, one-time) and, inside a cadence, what weighs
 * most on the month first.
 */
export function sortPlanItems(
  items: RecurrentTransaction[],
  ctx: MoneyContext
): RecurrentTransaction[] {
  const rank = (i: RecurrentTransaction) => CADENCE_SECTIONS.indexOf(sectionFor(i.frequency));
  return [...items].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      toMonthlyAmount(b, ctx) - toMonthlyAmount(a, ctx) ||
      a.name.localeCompare(b.name)
  );
}

/** "≈" only means something when at least one item had to be converted. */
export function hasForeignCurrency(items: RecurrentTransaction[], target: Currency): boolean {
  return items.some((i) => i.currency !== target);
}
