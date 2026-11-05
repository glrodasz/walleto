import { toDateInputValue } from "./scheduleAnchor";
import type { ExpenseDraft, Frequency } from "../types";

/** Plenty for "things to enter later"; stops a runaway client from bloating the user doc. */
export const MAX_DRAFTS = 50;

export interface DraftSchedule {
  frequency: Frequency;
  dayOfMonth: number;
  month: number;
  /** YYYY-MM-DD. */
  date: string;
}

/** YYYY-MM-DD as a local date; null when it doesn't parse. */
function parseDay(value: string | undefined): Date | null {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
}

/**
 * What the full form starts with when a draft becomes an expense. Whatever
 * the draft left open falls back to the day it was jotted down — the day the
 * service was taken is the best guess for when it charges — and a draft with
 * no cadence opens as monthly, the form's own default.
 */
export function draftSchedule(draft: ExpenseDraft): DraftSchedule {
  const stamp = new Date(draft.createdAt);
  const created = Number.isNaN(stamp.getTime()) ? new Date() : stamp;
  const picked = parseDay(draft.date);
  const day = picked ?? created;
  return {
    frequency: draft.frequency ?? "MONTHLY",
    dayOfMonth:
      draft.frequency === "MONTHLY" && draft.dayOfMonth ? draft.dayOfMonth : day.getDate(),
    month: day.getMonth(),
    date: toDateInputValue(day),
  };
}

/** Oldest first: the order they were jotted down, so the list doesn't reshuffle as one is added. */
export function sortDrafts(drafts: ExpenseDraft[] | undefined): ExpenseDraft[] {
  return [...(drafts ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
