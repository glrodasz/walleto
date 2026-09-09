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
    occurredAt,
  };
}
