import { toMonthlyAmount } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import type { RecurrentTransaction } from "../../../types";

export interface WhatIfImpact {
  /** Monthly amount freed by cancelling the checked items, converted to ctx.target. */
  freedMonthly: number;
  freedAnnual: number;
  excludedNames: string[];
}

/**
 * The effect of hypothetically cancelling a set of recurrent items. Cancelling
 * an EXPENSE, INVESTMENT or SAVING item all raise net the same way — each is
 * subtracted in the flow formula, so removing it adds its monthly amount back
 * to unallocated cash. INCOME items are the caller's responsibility to
 * exclude from the candidate list; "cancelling" income isn't this feature.
 */
export function computeWhatIfImpact(
  items: RecurrentTransaction[],
  excludedIds: ReadonlySet<string>,
  ctx: MoneyContext
): WhatIfImpact {
  const excluded = items.filter((i) => i.id && excludedIds.has(i.id));

  const freedMonthly = excluded.reduce((sum, i) => sum + toMonthlyAmount(i, ctx), 0);

  return {
    freedMonthly,
    freedAnnual: freedMonthly * 12,
    excludedNames: excluded.map((i) => i.name),
  };
}
