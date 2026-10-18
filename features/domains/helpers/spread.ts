import { FREQ_TO_MONTHS } from "../../../helpers/aggregations";
import { materializeOccurrences, occurrenceId } from "../../../helpers/materializeOccurrences";
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

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const at = (date: Date) => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
});

/**
 * The payment that settled one occurrence: the row at its deterministic id,
 * or the item's row dated inside that cycle (paid on another day).
 */
function paymentFor(
  itemId: string,
  occ: Date,
  next: Date | undefined,
  rows: Transaction[]
): Transaction | undefined {
  const id = occurrenceId(itemId, occ);
  const from = startOfDay(occ);
  return (
    rows.find((t) => t.id === id) ??
    rows.find((t) => {
      const at = t.occurredAt.toDate();
      return at >= from && (!next || at < next);
    })
  );
}

/**
 * How far back the ledger has to reach so every window's slice can find the
 * payment it spreads: the occurrence that covers `from` for each spread item
 * (last January's yearly payment for a page that starts in March).
 */
export function spreadLookback(items: RecurrentTransaction[], from: Date): Date {
  let earliest = from;
  for (const item of items) {
    if (!item.id || !isSpreadItem(item)) continue;
    const start = item.startDate.toDate();
    if (start >= from) continue;
    const covering = materializeOccurrences(item, start, from).pop()?.occurredAt;
    if (covering && covering < earliest) earliest = startOfDay(covering);
  }
  return earliest;
}

/**
 * The rows the domain page charts: the real ones, minus those written by
 * spread items' current schedule, plus one synthetic slice per spread item per window it was
 * live in. A slice spreads the payment of the cycle that covers its month
 * (amount × FREQ_TO_MONTHS, that payment's currency and charged pair), so
 * raising the item's price only changes cycles not paid yet; a cycle with no
 * payment in the ledger spreads the item's current amount. Slices carry the
 * item id and category, so hiding composes through `helpers/hidden`
 * unchanged. The ledger and the checklist keep the real rows.
 */
export function spreadTransactions(
  items: RecurrentTransaction[],
  transactions: Transaction[],
  windows: MonthWindow[]
): Transaction[] {
  const spread = items.filter((i) => i.id && isSpreadItem(i));
  if (spread.length === 0) return transactions;
  // Only the current schedule's rows give way to slices: a row dated before
  // the item's start was paid under an earlier schedule (the monthly SEK 39
  // before the item turned yearly) and stays as it was.
  const starts = new Map(spread.map((i) => [i.id!, startOfDay(i.startDate.toDate())]));
  const kept: Transaction[] = [];
  const paid = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const start = t.recurrentTransactionId ? starts.get(t.recurrentTransactionId) : undefined;
    if (!start || t.occurredAt.toDate() < start) {
      kept.push(t);
      continue;
    }
    const list = paid.get(t.recurrentTransactionId!) ?? [];
    list.push(t);
    paid.set(t.recurrentTransactionId!, list);
  }

  const slices: SpreadSlice[] = [];
  const last = windows[windows.length - 1];
  for (const item of spread) {
    const factor = FREQ_TO_MONTHS[item.frequency];
    const start = item.startDate.toDate();
    const end = item.endDate?.toDate();
    const occs = last
      ? materializeOccurrences(item, start, new Date(last.end.getTime() - 1)).map(
          (o) => o.occurredAt
        )
      : [];
    const rows = paid.get(item.id!) ?? [];
    for (const w of windows) {
      if (start >= w.end || (end && end < w.start)) continue;
      // The cycle covering this month: its latest occurrence before month end.
      let i = -1;
      while (i + 1 < occs.length && occs[i + 1] < w.end) i++;
      const payment = i >= 0 ? paymentFor(item.id!, occs[i], occs[i + 1], rows) : undefined;
      const source = payment ?? item;
      slices.push({
        id: `${item.id}_spread_${w.key}`,
        userId: item.userId,
        domain: item.domain,
        recurrentTransactionId: item.id!,
        categoryId: item.categoryId,
        ...(item.accountId ? { accountId: item.accountId } : {}),
        name: item.name,
        amount: source.amount * factor,
        currency: source.currency,
        ...(source.chargedAmount !== undefined && source.chargedCurrency
          ? {
              chargedAmount: source.chargedAmount * factor,
              chargedCurrency: source.chargedCurrency,
            }
          : {}),
        occurredAt: at(w.start),
        status: "PAID",
        synthetic: true,
      });
    }
  }
  return [...kept, ...slices];
}
