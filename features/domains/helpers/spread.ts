import { FREQ_TO_MONTHS } from "../../../helpers/aggregations";
import type { RecurrentTransaction, Transaction } from "../../../types";
import type { MonthWindow } from "./months";

/** A synthetic monthly slice of a spread item; never stored. */
export interface SpreadSlice extends Transaction {
  synthetic: true;
}

export function isSyntheticRow(t: Transaction): t is SpreadSlice {
  return (t as SpreadSlice).synthetic === true;
}

/**
 * An active item that asked to be reflected monthly and whose cadence is
 * not already monthly. One time has nothing to spread.
 */
export function isSpreadItem(
  item: Pick<RecurrentTransaction, "spreadMonthly" | "frequency" | "active">
): boolean {
  return (
    Boolean(item.spreadMonthly) &&
    item.active &&
    item.frequency !== "MONTHLY" &&
    item.frequency !== "ONE_TIME"
  );
}

export function spreadItemIds(items: RecurrentTransaction[]): Set<string> {
  return new Set(items.filter((i) => i.id && isSpreadItem(i)).map((i) => i.id!));
}

const at = (date: Date) => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
});

/**
 * The rows the domain page charts: the real ones, minus those written by
 * spread items, plus one synthetic slice per spread item per window it was
 * live in (amount × FREQ_TO_MONTHS, the item's own currency, the charged
 * pair scaled alongside). Slices carry the item id and category, so hiding
 * composes through `helpers/hidden` unchanged. The ledger and the checklist
 * keep the real rows.
 */
export function spreadTransactions(
  items: RecurrentTransaction[],
  transactions: Transaction[],
  windows: MonthWindow[]
): Transaction[] {
  const spread = items.filter((i) => i.id && isSpreadItem(i));
  if (spread.length === 0) return transactions;
  const ids = new Set(spread.map((i) => i.id!));
  const kept = transactions.filter(
    (t) => !t.recurrentTransactionId || !ids.has(t.recurrentTransactionId)
  );

  const slices: SpreadSlice[] = [];
  for (const item of spread) {
    const factor = FREQ_TO_MONTHS[item.frequency];
    const start = item.startDate.toDate();
    const end = item.endDate?.toDate();
    for (const w of windows) {
      if (start >= w.end || (end && end < w.start)) continue;
      slices.push({
        id: `${item.id}_spread_${w.key}`,
        userId: item.userId,
        domain: item.domain,
        recurrentTransactionId: item.id!,
        categoryId: item.categoryId,
        ...(item.accountId ? { accountId: item.accountId } : {}),
        name: item.name,
        amount: item.amount * factor,
        currency: item.currency,
        ...(item.chargedAmount !== undefined && item.chargedCurrency
          ? { chargedAmount: item.chargedAmount * factor, chargedCurrency: item.chargedCurrency }
          : {}),
        occurredAt: at(w.start),
        status: "PAID",
        synthetic: true,
      });
    }
  }
  return [...kept, ...slices];
}
