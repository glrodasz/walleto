import type { Frequency } from "../types";

const STEP_DAYS: Partial<Record<Frequency, number>> = {
  WEEKLY: 7,
  BIWEEKLY: 14,
};

const STEP_MONTHS: Partial<Record<Frequency, number>> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  YEARLY: 12,
};

export interface RecurrenceOptions {
  /**
   * BIWEEKLY only: the second payment day of the month. With it, "biweekly"
   * means twice a month on the anchor's day and this one (1st and 15th);
   * without it, the legacy 14-day step, so older items keep their schedule.
   */
  secondDayOfMonth?: number;
}

/**
 * First occurrence strictly after `from` for a schedule anchored at `startDate`.
 * ONE_TIME has no next occurrence, so it returns null.
 *
 * Month-based frequencies clamp to the last day of the target month, so a
 * schedule anchored on the 31st lands on Feb 28/29 rather than rolling into March.
 */
export function nextOccurrenceFrom(
  startDate: Date,
  frequency: Frequency,
  from: Date = new Date(),
  opts: RecurrenceOptions = {}
): Date | null {
  if (frequency === "ONE_TIME") return null;

  if (frequency === "BIWEEKLY" && opts.secondDayOfMonth) {
    return nextTwiceMonthly(startDate, opts.secondDayOfMonth, from);
  }

  const days = STEP_DAYS[frequency];
  if (days) {
    const stepMs = days * 24 * 60 * 60 * 1000;
    const elapsed = from.getTime() - startDate.getTime();
    if (elapsed < 0) return new Date(startDate);
    const steps = Math.floor(elapsed / stepMs) + 1;
    return new Date(startDate.getTime() + steps * stepMs);
  }

  const months = STEP_MONTHS[frequency];
  if (!months) return null;
  if (from < startDate) return new Date(startDate);

  const anchorDay = startDate.getDate();
  let candidate = addMonthsClamped(startDate, months, anchorDay);
  while (candidate <= from) {
    candidate = addMonthsClamped(candidate, months, anchorDay);
  }
  return candidate;
}

/** Two fixed days a month, each clamped to the month's length. */
function nextTwiceMonthly(startDate: Date, secondDay: number, from: Date): Date {
  if (from < startDate) return new Date(startDate);
  const days = Array.from(new Set([startDate.getDate(), secondDay])).sort((a, b) => a - b);
  let year = from.getFullYear();
  let month = from.getMonth();
  // Two months always contain the next occurrence; the loop bound is just a guard.
  for (let i = 0; i < 3; i++) {
    for (const day of days) {
      const candidate = clampedDay(year, month, day, startDate);
      if (candidate > from && candidate >= startDate) return candidate;
    }
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return clampedDay(year, month, days[0], startDate);
}

function clampedDay(year: number, month: number, day: number, timeFrom: Date): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(
    year,
    month,
    Math.min(day, lastDay),
    timeFrom.getHours(),
    timeFrom.getMinutes(),
    timeFrom.getSeconds(),
    timeFrom.getMilliseconds()
  );
}

function addMonthsClamped(date: Date, months: number, anchorDay: number): Date {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(anchorDay, lastDay));
  next.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  return next;
}
