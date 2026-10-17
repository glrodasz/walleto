import { anchorStartDate, isSameSchedule } from "../../../helpers/scheduleAnchor";
import type { RecurrentTransactionUpdate } from "../../../schemas";
import type { RecurrentTransaction, RecurrentTransactionType } from "../../../types";
import type { RecurrentRow } from "../hooks/useRecurrentStep";

const scheduleOf = (row: RecurrentRow) => ({
  frequency: row.frequency,
  dayOfMonth: row.dayOfMonth,
  secondDayOfMonth: row.secondDayOfMonth,
  month: row.month,
  date: row.date,
});

/**
 * What a saved plan item's row changed, as a PATCH — or null when nothing did.
 * The schedule is compared as a choice (`isSameSchedule`), never as a freshly
 * anchored date: re-anchoring an untouched row would move its startDate to
 * this month and drop the history it was backfilled with.
 */
export function recurrentPatch(
  row: RecurrentRow,
  item: RecurrentTransaction,
  { amount, type, backfill }: { amount: number; type: RecurrentTransactionType; backfill: boolean }
): RecurrentTransactionUpdate | null {
  const patch: RecurrentTransactionUpdate = {};
  const name = row.name.trim();
  if (name !== item.name) patch.name = name;
  if (amount !== item.amount) patch.amount = amount;
  if (row.currency !== item.currency) patch.currency = row.currency;
  if (row.categoryId !== item.categoryId) {
    patch.categoryId = row.categoryId;
    if (type !== item.type) patch.type = type;
  }
  if ((row.paymentMethodId || null) !== (item.paymentMethodId ?? null)) {
    patch.paymentMethodId = row.paymentMethodId || null;
  }

  const stored = {
    frequency: item.frequency,
    startDate: item.startDate.toDate(),
    secondDayOfMonth: item.secondDayOfMonth,
  };
  if (!isSameSchedule(scheduleOf(row), stored)) {
    if (row.frequency !== item.frequency) patch.frequency = row.frequency;
    patch.startDate = anchorStartDate({ ...scheduleOf(row), backfill }).toISOString();
    if (row.frequency === "BIWEEKLY") patch.secondDayOfMonth = row.secondDayOfMonth;
    else if (item.secondDayOfMonth !== undefined) patch.secondDayOfMonth = null;
  }

  return Object.keys(patch).length ? patch : null;
}
