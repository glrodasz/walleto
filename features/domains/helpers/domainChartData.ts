import { convertedAmount } from "../../../helpers/aggregations";
import type { MoneyContext, MoneyFields } from "../../../helpers/aggregations";
import { bucketLabel, bucketStart, nextBucketStart, toDate } from "../../../helpers/chartData";
import type { ChartBucket } from "../../../helpers/chartData";

export interface DomainChartPoint {
  label: string;
  /** Running total since the period started, in the reporting currency. */
  total: number;
  /** What this bucket alone added. */
  added: number;
  /** Names of the transactions inside the bucket, for the tooltip. */
  names: string[];
}

interface ChartInput extends MoneyFields {
  occurredAt: unknown;
  name: string;
}

interface SeriesOptions {
  from: Date;
  to?: Date;
  bucket: ChartBucket;
}

/**
 * "So far this period": one point per bucket between `from` and `to`, every
 * bucket present (quiet stretches stay flat instead of vanishing), each point
 * carrying the running total. A single salary reads as one step up and then a
 * flat line — never as a slope towards zero, which is what joining raw
 * transactions produced.
 */
export function toCumulativeSeries(
  transactions: ChartInput[],
  ctx: MoneyContext,
  { from, to = new Date(), bucket }: SeriesOptions
): DomainChartPoint[] {
  if (to < from) return [];

  const points = new Map<number, DomainChartPoint>();
  for (
    let cursor = bucketStart(from, bucket);
    cursor <= to;
    cursor = nextBucketStart(cursor, bucket)
  ) {
    points.set(cursor.getTime(), {
      label: bucketLabel(cursor, bucket),
      total: 0,
      added: 0,
      names: [],
    });
  }

  for (const t of transactions) {
    const point = points.get(bucketStart(toDate(t.occurredAt), bucket).getTime());
    if (!point) continue;
    point.added += convertedAmount(t, ctx);
    point.names.push(t.name);
  }

  let running = 0;
  for (const point of points.values()) {
    running += point.added;
    point.total = running;
  }

  return Array.from(points.values());
}
