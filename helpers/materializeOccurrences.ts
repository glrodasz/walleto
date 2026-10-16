import { nextOccurrenceFrom } from "./recurrence";
import type { Frequency, RecurrentTransaction, Timestamp } from "../types";

export interface Occurrence {
  /** Deterministic: `{itemId}_{YYYY-MM-DD}` — re-materializing can never duplicate. */
  id: string;
  occurredAt: Date;
}

interface ScheduleFields {
  id?: string;
  frequency: Frequency;
  secondDayOfMonth?: number;
  startDate: Timestamp;
  endDate?: Timestamp;
}

export function occurrenceId(itemId: string, occurredAt: Date): string {
  return `${itemId}_${occurredAt.toISOString().slice(0, 10)}`;
}

/**
 * All occurrences of a recurrent item that fall inside [from, to], anchored at
 * the item's startDate (so monthly-on-the-31st clamps exactly like
 * nextOccurrenceFrom does). ONE_TIME contributes its startDate alone.
 * The item's endDate, when set, caps the schedule.
 */
export function materializeOccurrences(item: ScheduleFields, from: Date, to: Date): Occurrence[] {
  if (!item.id || to < from) return [];

  const start = item.startDate.toDate();
  const end = item.endDate?.toDate();
  const cap = end && end < to ? end : to;

  const occurrences: Occurrence[] = [];
  const opts = { secondDayOfMonth: item.secondDayOfMonth };
  let current: Date | null =
    start >= from
      ? start
      : nextOccurrenceFrom(start, item.frequency, new Date(from.getTime() - 1), opts);

  while (current && current <= cap) {
    occurrences.push({ id: occurrenceId(item.id, current), occurredAt: current });
    current = nextOccurrenceFrom(start, item.frequency, current, opts);
  }

  return occurrences;
}

/**
 * The transaction doc fields an occurrence inherits from its recurrent item.
 * Money is copied verbatim (native currency + charged pair); status is the
 * caller's call — the 6-month synthetic backfill writes PAID.
 */
export function occurrenceToTransaction(item: RecurrentTransaction, occurredAt: Date) {
  return {
    userId: item.userId,
    domain: item.domain,
    recurrentTransactionId: item.id!,
    categoryId: item.categoryId,
    ...(item.accountId ? { accountId: item.accountId } : {}),
    name: item.name,
    amount: item.amount,
    currency: item.currency,
    ...(item.chargedAmount !== undefined ? { chargedAmount: item.chargedAmount } : {}),
    ...(item.chargedCurrency ? { chargedCurrency: item.chargedCurrency } : {}),
    ...(item.paymentMethodId ? { paymentMethodId: item.paymentMethodId } : {}),
    ...(item.inheritTags && item.tags?.length ? { tags: item.tags } : {}),
    ...(item.inheritNote && item.note ? { note: item.note } : {}),
    occurredAt,
  };
}

/** The calendar day an occurrence id names: `{itemId}_2026-09-27` → "2026-09-27". */
function occurrenceDay(itemId: string, rowId: string): string | null {
  const prefix = `${itemId}_`;
  if (!rowId.startsWith(prefix)) return null;
  const day = rowId.slice(prefix.length);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

/**
 * After a schedule change, the item's rows written by the old schedule on or
 * after the new start are not payments of the new one (a monthly row on the
 * 9th once the item is yearly on the 27th). Rows before the new start are
 * history and stay. Only deterministic occurrence ids are considered: a row
 * with any other id was not written by the schedule.
 */
export function staleOccurrenceIds(
  item: ScheduleFields & { id: string },
  rowIds: string[],
  now: Date = new Date()
): string[] {
  const startDay = item.startDate.toDate().toISOString().slice(0, 10);
  const candidates = rowIds.filter((rowId) => {
    const day = occurrenceDay(item.id, rowId);
    return day !== null && day >= startDay;
  });
  if (candidates.length === 0) return [];

  const lastDay = candidates
    .map((rowId) => occurrenceDay(item.id, rowId)!)
    .reduce((a, b) => (a > b ? a : b));
  const to = new Date(Math.max(now.getTime(), new Date(`${lastDay}T23:59:59.999Z`).getTime()));
  const valid = new Set(materializeOccurrences(item, item.startDate.toDate(), to).map((o) => o.id));
  return candidates.filter((rowId) => !valid.has(rowId));
}
