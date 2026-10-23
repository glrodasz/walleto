import { tryConvert } from "../../../helpers/fx";
import type { ExchangeRates } from "../../../helpers/fx";
import { toDate } from "../../../helpers/chartData";
import type { RecurrentTransaction, Transaction } from "../../../types";

/** How far back a variable item's average looks: the six months before the one on screen. */
export const AVERAGE_MONTHS = 6;

/** The first day of the averaging range for a month starting at `monthStart`. */
export function averageFrom(monthStart: Date): Date {
  return new Date(monthStart.getFullYear(), monthStart.getMonth() - AVERAGE_MONTHS, 1);
}

export interface VariableAverage {
  /** Per payment, in the item's currency. */
  amount: number;
  /** How many confirmed payments it averages: up to 6 for a monthly item, more for a weekly one. */
  payments: number;
}

/**
 * What a variable item actually cost over the six months before `monthStart`:
 * the mean of its paid rows whose real amount is known — confirmed, or written
 * before the item had a band. Estimates still carrying a band say nothing
 * about what was spent, so they stay out. Null for a fixed item, or when no
 * month in the range has a real amount.
 */
export function variableAverage(
  item: Pick<RecurrentTransaction, "id" | "amountFloor" | "currency">,
  transactions: Transaction[],
  monthStart: Date,
  rates: ExchangeRates | null
): VariableAverage | null {
  if (item.amountFloor === undefined || !item.id) return null;
  const from = averageFrom(monthStart);
  let sum = 0;
  let count = 0;
  for (const row of transactions) {
    if (row.recurrentTransactionId !== item.id || row.status !== "PAID") continue;
    if (row.amountFloor !== undefined) continue;
    const at = toDate(row.occurredAt);
    if (at < from || at >= monthStart) continue;
    const amount = tryConvert(row.amount, row.currency, item.currency, rates);
    if (amount === null) continue;
    sum += amount;
    count += 1;
  }
  return count === 0 ? null : { amount: sum / count, payments: count };
}
