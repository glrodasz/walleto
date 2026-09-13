import type { Timestamp } from "../../types";

/** Structural Timestamp, the shape every Firestore-backed type expects. */
export function ts(date: Date): Timestamp {
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => date,
  };
}

/**
 * Stories run against the real clock: `useSelectedMonth` falls back to the
 * current month without a provider, so fixtures are anchored to today.
 */
export const NOW = new Date();

/** Midnight on `day` of the month `n` months before now. */
export function monthsAgo(n: number, day = 1): Date {
  return new Date(NOW.getFullYear(), NOW.getMonth() - n, day, 9, 0, 0);
}

/** `n` days from now, at 9:00. */
export function daysFromNow(n: number): Date {
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + n, 9, 0, 0);
  return d;
}

export const STORY_USER_ID = "auth0|story-user";
