import { convertedAmount } from "./aggregations";
import type { MoneyContext, MoneyFields } from "./aggregations";
import { rootIdMap, rootIdOf } from "./categoryTree";
import { monthKey } from "./dates";
import { toDate } from "./chartData";
import type { Category, Domain } from "../types";

export interface StackSeries {
  key: string;
  label: string;
  /** A CSS colour or `var(--token)`; never a `color-mix()` expression (SVG can't take it). */
  color: string;
}

export interface StackedTotals {
  /** window key → series key → converted total. Every window and series is present (0 when empty). */
  totals: Record<string, Record<string, number>>;
  /** Largest grand total first; "Other" last when the cap folded anything. */
  series: StackSeries[];
}

export const OTHER_KEY = "__other";
export const OTHER_LABEL = "Other";

export interface StackRow extends MoneyFields {
  occurredAt: unknown;
}

interface StackOptions {
  /** Keep this many series; the rest fold into "Other". No cap by default. */
  top?: number;
  label: (key: string) => string;
  /** Colour by rank (0 = largest). */
  color: (index: number) => string;
  otherColor?: string;
}

/**
 * Monthly totals split by any key of the row (category, currency…), capped
 * to the biggest `top` keys with the remainder folded into one "Other"
 * series. Amounts are converted into the reporting currency so the stack
 * adds up to the month's total.
 */
export function monthTotalsBy<T extends StackRow>(
  rows: T[],
  ctx: MoneyContext,
  windows: { key: string }[],
  keyOf: (row: T) => string,
  opts: StackOptions
): StackedTotals {
  const perMonth: Record<string, Record<string, number>> = {};
  for (const w of windows) perMonth[w.key] = {};
  const grand: Record<string, number> = {};

  for (const row of rows) {
    const month = monthKey(toDate(row.occurredAt));
    if (!(month in perMonth)) continue;
    const key = keyOf(row);
    const value = convertedAmount(row, ctx);
    perMonth[month][key] = (perMonth[month][key] ?? 0) + value;
    grand[key] = (grand[key] ?? 0) + value;
  }

  const ranked = Object.keys(grand).sort((a, b) => grand[b] - grand[a]);
  const kept =
    opts.top !== undefined && ranked.length > opts.top ? ranked.slice(0, opts.top) : ranked;
  const folded = new Set(ranked.slice(kept.length));

  const series: StackSeries[] = kept.map((key, i) => ({
    key,
    label: opts.label(key),
    color: opts.color(i),
  }));
  if (folded.size > 0) {
    series.push({
      key: OTHER_KEY,
      label: OTHER_LABEL,
      color: opts.otherColor ?? opts.color(kept.length),
    });
  }

  const totals: Record<string, Record<string, number>> = {};
  for (const w of windows) {
    const month: Record<string, number> = {};
    for (const s of series) month[s.key] = 0;
    for (const [key, value] of Object.entries(perMonth[w.key])) {
      month[folded.has(key) ? OTHER_KEY : key] += value;
    }
    totals[w.key] = month;
  }

  return { totals, series };
}

const TINT_STEPS = 6;

/** The n-th tint of a domain's accent, from the ramps in globals.css. */
export function domainTint(domain: Domain, index: number): string {
  const step = Math.min(index + 1, TINT_STEPS);
  return `var(--tint-${domain.toLowerCase()}-${step})`;
}

export function domainAccent(domain: Domain): string {
  return `var(--domain-${domain.toLowerCase()})`;
}

/** Category-stacked months: children fold into their root, top roots keep their own slice. */
export function monthTotalsByCategory<T extends StackRow & { categoryId: string }>(
  rows: T[],
  categories: Category[],
  ctx: MoneyContext,
  windows: { key: string }[],
  opts: { domain: Domain; top?: number }
): StackedTotals {
  const roots = rootIdMap(categories);
  const names = new Map(categories.map((c) => [c.id ?? "", c.name]));
  return monthTotalsBy(rows, ctx, windows, (row) => rootIdOf(row.categoryId, roots), {
    top: opts.top ?? 5,
    label: (key) => names.get(key) ?? "Unknown",
    color: (i) => domainTint(opts.domain, i),
    otherColor: domainTint(opts.domain, TINT_STEPS - 1),
  });
}
