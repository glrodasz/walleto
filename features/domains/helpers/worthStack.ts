import { monthKey } from "../../../helpers/dates";
import type { StackedTotals } from "../../../helpers/stacks";
import type { GainRow } from "../../investments/helpers/valuationGains";
import { monthWindows, monthsApart } from "./months";
import type { MonthWindow } from "./months";

/**
 * What the bars of an account domain measure: what each category is worth at
 * the end of every month, or what moved in it (contributions and gains).
 */
export type ChartMeasure = "worth" | "activity";

export function parseChartMeasure(raw: string): ChartMeasure {
  try {
    return JSON.parse(raw) === "activity" ? "activity" : "worth";
  } catch {
    return "worth";
  }
}

/**
 * Every month from the earliest date up to the one `now` sits in, oldest
 * first and never fewer than `min` — the span a running total has to walk so
 * the first bar on the chart already carries everything before it.
 */
export function historyWindows(dates: Date[], now: Date, min: number): MonthWindow[] {
  const earliest = dates.reduce<Date | null>((a, d) => (!a || d < a ? d : a), null);
  const span = earliest ? monthsApart(earliest, now) + 1 : 0;
  return monthWindows(Math.max(span, min), now);
}

/**
 * A month's flow turned into its end-of-month balance: each series carries
 * the sum of itself over every window up to and including that one. Windows
 * must come oldest first; series are untouched.
 */
export function runningTotals(stacks: StackedTotals, windows: { key: string }[]): StackedTotals {
  const carried: Record<string, number> = {};
  const totals: Record<string, Record<string, number>> = {};
  for (const w of windows) {
    const month: Record<string, number> = {};
    for (const s of stacks.series) {
      carried[s.key] = (carried[s.key] ?? 0) + (stacks.totals[w.key]?.[s.key] ?? 0);
      month[s.key] = carried[s.key];
    }
    totals[w.key] = month;
  }
  return { series: stacks.series, totals };
}

/**
 * The gains the value checks reported, summed per window key (0 where none
 * landed). `unfiledOnly` keeps the ones no category holds — the ones the bars
 * stack as a "Gain" segment of their own.
 */
export function gainsByWindow(
  rows: GainRow[],
  windows: { key: string }[],
  unfiledOnly = false
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const w of windows) out[w.key] = 0;
  for (const r of rows) {
    if (unfiledOnly && r.categoryId) continue;
    const key = monthKey(r.at);
    if (key in out) out[key] += r.gain;
  }
  return out;
}

/**
 * Every gain reported before `end`, per root category — what the checks add
 * to a category's worth at that date. Unfiled gains are left out, as in
 * `gainsByCategory`.
 */
export function gainsByCategoryUntil(rows: GainRow[], end: Date): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    if (!r.categoryId || r.at >= end) continue;
    out[r.categoryId] = (out[r.categoryId] ?? 0) + r.gain;
  }
  return out;
}

/** The unfiled gains reported before `end`, summed. */
export function unfiledGainUntil(rows: GainRow[], end: Date): number {
  return rows.filter((r) => !r.categoryId && r.at < end).reduce((sum, r) => sum + r.gain, 0);
}
