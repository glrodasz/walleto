import { convertedAmount } from "./aggregations";
import type { MoneyContext, MoneyFields } from "./aggregations";
import type { Domain } from "../types";

export type ChartBucket = "day" | "week" | "month";

/** Bucket size for a period: days up to 1 month, weeks up to 3, months beyond. */
export function bucketForRange(months: number): ChartBucket {
  if (months <= 1) return "day";
  if (months <= 3) return "week";
  return "month";
}

export interface FlowPoint {
  label: string;
  income: number;
  expense: number;
}

interface FlowInput extends MoneyFields {
  domain: Domain;
  occurredAt: unknown;
}

export function toDate(occurredAt: unknown): Date {
  const ts = occurredAt as { toDate?: () => Date };
  return typeof ts?.toDate === "function" ? ts.toDate() : new Date(occurredAt as string);
}

export function bucketStart(date: Date, bucket: ChartBucket): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (bucket === "day") return d;
  if (bucket === "week") {
    // Monday-anchored weeks.
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function nextBucketStart(date: Date, bucket: ChartBucket): Date {
  const d = new Date(date);
  if (bucket === "day") d.setDate(d.getDate() + 1);
  else if (bucket === "week") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

const DAY_LABEL = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const MONTH_LABEL = new Intl.DateTimeFormat("en", { month: "short" });

export function bucketLabel(date: Date, bucket: ChartBucket): string {
  return bucket === "month" ? MONTH_LABEL.format(date) : DAY_LABEL.format(date);
}

/**
 * INCOME and EXPENSE transactions folded into a two-series time axis:
 * every bucket between `from` and `to` exists (empty ones at zero, so lines
 * don't skip quiet stretches), amounts converted via the money context.
 * Other domains are ignored.
 */
export function toFlowSeries(
  transactions: FlowInput[],
  opts: MoneyContext & { from: Date; to?: Date; bucket: ChartBucket }
): FlowPoint[] {
  const to = opts.to ?? new Date();
  if (to < opts.from) return [];

  const points = new Map<number, FlowPoint>();
  for (
    let cursor = bucketStart(opts.from, opts.bucket);
    cursor <= to;
    cursor = nextBucketStart(cursor, opts.bucket)
  ) {
    points.set(cursor.getTime(), {
      label: bucketLabel(cursor, opts.bucket),
      income: 0,
      expense: 0,
    });
  }

  for (const t of transactions) {
    if (t.domain !== "INCOME" && t.domain !== "EXPENSE") continue;
    const key = bucketStart(toDate(t.occurredAt), opts.bucket).getTime();
    const point = points.get(key);
    if (!point) continue;

    const value = convertedAmount(t, opts);
    if (t.domain === "INCOME") point.income += value;
    else point.expense += value;
  }

  return Array.from(points.values());
}
