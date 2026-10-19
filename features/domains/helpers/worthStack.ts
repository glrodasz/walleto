import { monthKey } from "../../../helpers/dates";
import { toDate } from "../../../helpers/chartData";
import { convertedAmount } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import type { StackedTotals } from "../../../helpers/stacks";
import type { GainRow } from "../../investments/helpers/valuationGains";
import { selectorKey } from "../../investments/helpers/valuation";
import { monthWindows, monthsApart } from "./months";
import type { MonthWindow } from "./months";
import type { Domain, Language, Transaction } from "../../../types";

/**
 * What the bars of an account domain measure: what each category is worth at
 * the end of every month, or what moved in it (contributions and gains).
 */
export type ChartMeasure = "worth" | "activity";

/**
 * What the page's figures (the summary and the Categories view) speak about:
 * the selected month's flow, or the running total at its end — the worth.
 */
export type SummaryScope = "month" | "total";

export function parseSummaryScope(raw: string): SummaryScope {
  try {
    return JSON.parse(raw) === "total" ? "total" : "month";
  } catch {
    return "month";
  }
}

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
export function historyWindows(
  dates: Date[],
  now: Date,
  min: number,
  language: Language = "en"
): MonthWindow[] {
  const earliest = dates.reduce<Date | null>((a, d) => (!a || d < a ? d : a), null);
  const span = earliest ? monthsApart(earliest, now) + 1 : 0;
  return monthWindows(Math.max(span, min), now, language);
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

/**
 * The ledger rows a domain's running worth is built from, given the gain rows
 * `useDomainGains` reports as `worthRows`. An asset keeps every row: its
 * chain telescopes from inception. A debt keeps only the repayments after
 * its chain's first balance check — that check already carries the whole
 * balance (`anchorDebt`) — and a debt with no check at all has no known
 * balance, so its rows are left out, as on the dashboard.
 */
export function worthLedger(
  transactions: Transaction[],
  worthRows: GainRow[],
  domain: Domain
): Transaction[] {
  if (domain !== "DEBT") return transactions;
  const firstCheck = new Map<string, Date>();
  for (const r of worthRows) {
    const seen = firstCheck.get(r.selector);
    if (!seen || r.at < seen) firstCheck.set(r.selector, r.at);
  }
  return transactions.filter((t) => {
    const key = selectorKey(t.accountId ? { accountId: t.accountId } : { domain: "DEBT" });
    const anchor = firstCheck.get(key);
    // A repayment on the check's own instant is already in the balance it states.
    return anchor !== undefined && toDate(t.occurredAt) > anchor;
  });
}

/**
 * What the ledger and the gains add up to before `end`, leaving out the
 * categories in `hidden` (a gain nobody filed always counts). Signed like
 * the chain: a debt comes out negative.
 */
export function worthUntil(
  ledger: Transaction[],
  worthRows: GainRow[],
  end: Date,
  ctx: MoneyContext,
  hidden: Set<string> = new Set()
): number {
  const paid = ledger
    .filter((t) => !hidden.has(t.categoryId) && toDate(t.occurredAt) < end)
    .reduce((sum, t) => sum + convertedAmount(t, ctx), 0);
  const gained = worthRows
    .filter((r) => r.at < end && !(r.categoryId && hidden.has(r.categoryId)))
    .reduce((sum, r) => sum + r.gain, 0);
  return paid + gained;
}
