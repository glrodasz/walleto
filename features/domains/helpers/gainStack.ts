import type { StackedTotals } from "../../../helpers/stacks";
import type { Domain } from "../../../types";

/**
 * Cannot collide with a stack key: category mode keys are Firestore ids plus
 * `__other`, currency mode keys are currency codes.
 */
export const GAIN_KEY = "__gain";
/** A token, never a `color-mix()` string — recharts puts this in a `fill`. */
export const GAIN_COLOR = "var(--bar-gain)";

/** What a value check's delta is called: a market gain, or on a debt the interest it revealed. */
export function gainLabel(domain: Domain): string {
  return domain === "DEBT" ? "Interest" : "Gain";
}

/**
 * The gain the month's value checks reported, appended as one more segment on
 * top of the contribution stack — in both category and currency mode, because
 * a market gain has neither a category nor a currency of its own. A month that
 * lost ground keeps its negative value; the chart draws it below the axis.
 * Returns the stack untouched when no month has a gain, so the domains without
 * accounts are unaffected.
 */
export function withGains(
  stacks: StackedTotals,
  gains: Record<string, number>,
  label = gainLabel("INVESTMENT")
): StackedTotals {
  if (!Object.values(gains).some((g) => g !== 0)) return stacks;
  return {
    series: [...stacks.series, { key: GAIN_KEY, label, color: GAIN_COLOR }],
    totals: Object.fromEntries(
      Object.entries(stacks.totals).map(([key, month]) => [
        key,
        { ...month, [GAIN_KEY]: gains[key] ?? 0 },
      ])
    ),
  };
}
