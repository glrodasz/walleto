import type { Frequency } from "../types";

/** How far back "backfill my history" reaches. Shared with the materializer. */
export const BACKFILL_MONTHS = 6;

export interface ScheduleChoice {
  frequency: Frequency;
  /** MONTHLY / QUARTERLY / YEARLY / BIWEEKLY: (first) payment day, 1–31. Defaults to the 1st. */
  dayOfMonth?: number;
  /** BIWEEKLY: the second payment day, 1–31. Stored on the item, not in startDate. */
  secondDayOfMonth?: number;
  /** YEARLY: month, 0–11 (defaults to January). QUARTERLY: the first month of the cycle. */
  month?: number;
  /** ONE_TIME / WEEKLY: an explicit date (YYYY-MM-DD). Defaults to today. */
  date?: string;
  /**
   * "I've been paying this for a while": anchor the schedule far enough back
   * that the materializer generates BACKFILL_MONTHS of history. For yearly
   * items it means the most recent anniversary already happened.
   */
  backfill?: boolean;
}

/** YYYY-MM-DD for `<input type="date">`, in local time. */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses YYYY-MM-DD as a local date at noon; falls back to `fallback` when unparsable. */
function parseDateInput(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return fallback;
  return new Date(y, m - 1, d, 12);
}

/** Day clamped to the target month's length, at noon local. */
function localNoon(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay), 12);
}

/**
 * Turns the user's schedule choice into the `startDate` the API stores. Noon
 * local (not midnight) keeps the UTC date inside the materializer's
 * `{itemId}_{YYYY-MM-DD}` ids equal to the local calendar day everywhere the
 * app is likely to run.
 */
export function anchorStartDate(choice: ScheduleChoice, now: Date = new Date()): Date {
  const today = localNoon(now.getFullYear(), now.getMonth(), now.getDate());
  const day = choice.dayOfMonth ?? 1;
  const monthsBack = choice.backfill ? BACKFILL_MONTHS : 0;

  switch (choice.frequency) {
    case "ONE_TIME":
      return parseDateInput(choice.date, today);

    case "WEEKLY": {
      const base = parseDateInput(choice.date, today);
      return choice.backfill
        ? localNoon(base.getFullYear(), base.getMonth() - BACKFILL_MONTHS, base.getDate())
        : base;
    }

    // Twice a month: the anchor carries the first day; the second lives on the item.
    case "BIWEEKLY":
    case "MONTHLY":
      return localNoon(now.getFullYear(), now.getMonth() - monthsBack, day);

    case "QUARTERLY": {
      if (choice.month === undefined) {
        return localNoon(now.getFullYear(), now.getMonth() - monthsBack, day);
      }
      // The most recent month in the cycle (every third month from `month`)
      // whose payment day is not ahead of today, then further back to backfill.
      let year = now.getFullYear();
      let month = now.getMonth() - ((now.getMonth() - choice.month + 12) % 3);
      if (localNoon(year, month, day) > today) month -= 3;
      const anchor = localNoon(year, month - monthsBack, day);
      year = anchor.getFullYear();
      return anchor;
    }

    case "YEARLY": {
      const month = choice.month ?? 0;
      const thisYear = localNoon(now.getFullYear(), month, day);
      if (!choice.backfill) return thisYear;
      return thisYear <= today ? thisYear : localNoon(now.getFullYear() - 1, month, day);
    }
  }
}

/** The inverse, for edit forms: which choice reproduces this stored startDate. */
export function scheduleChoiceFromStartDate(
  startDate: Date,
  frequency: Frequency,
  secondDayOfMonth?: number
): Omit<ScheduleChoice, "backfill"> {
  return {
    frequency,
    dayOfMonth: startDate.getDate(),
    month: startDate.getMonth(),
    date: toDateInputValue(startDate),
    ...(secondDayOfMonth !== undefined ? { secondDayOfMonth } : {}),
  };
}
