import { bucketForRange, bucketStart, nextBucketStart, toFlowSeries } from "./chartData";
import { IDENTITY_RATES } from "./fx";
import type { ExchangeRates } from "./fx";
import type { Currency, Domain } from "../types";

const RATES: ExchangeRates = {
  base: "USD",
  rates: { USD: 1, EUR: 1, MXN: 1, GBP: 1, SEK: 1, CHF: 1, JPY: 1, COP: 4000 },
  fetchedAt: "2026-06-01T00:00:00.000Z",
};

const tx = (domain: Domain, amount: number, iso: string, currency: Currency = "USD") => ({
  domain,
  amount,
  currency,
  occurredAt: iso,
});

const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };

describe("bucketForRange", () => {
  it("scales with the period", () => {
    expect(bucketForRange(0)).toBe("day");
    expect(bucketForRange(1)).toBe("day");
    expect(bucketForRange(3)).toBe("week");
    expect(bucketForRange(6)).toBe("month");
    expect(bucketForRange(12)).toBe("month");
  });
});

describe("toFlowSeries", () => {
  it("gap-fills empty buckets with zeros", () => {
    const series = toFlowSeries([tx("INCOME", 100, "2026-03-05T12:00:00")], {
      ...ctx,
      from: new Date(2026, 0, 15),
      to: new Date(2026, 3, 15),
      bucket: "month",
    });

    expect(series.map((p) => p.label)).toEqual(["Jan", "Feb", "Mar", "Apr"]);
    expect(series.map((p) => p.income)).toEqual([0, 0, 100, 0]);
  });

  it("splits income and expense into their own series", () => {
    const series = toFlowSeries(
      [
        tx("INCOME", 3000, "2026-03-01T09:00:00"),
        tx("EXPENSE", 1200, "2026-03-10T09:00:00"),
        tx("EXPENSE", 300, "2026-03-20T09:00:00"),
        tx("INVESTMENT", 999, "2026-03-15T09:00:00"),
      ],
      { ...ctx, from: new Date(2026, 2, 1), to: new Date(2026, 2, 31), bucket: "month" }
    );

    expect(series).toEqual([{ label: "Mar", income: 3000, expense: 1500 }]);
  });

  it("converts amounts into the target currency", () => {
    const series = toFlowSeries(
      [
        tx("EXPENSE", 40000, "2026-03-10T09:00:00", "COP"),
        tx("EXPENSE", 10, "2026-03-11T09:00:00"),
      ],
      {
        rates: RATES,
        target: "USD",
        from: new Date(2026, 2, 1),
        to: new Date(2026, 2, 31),
        bucket: "month",
      }
    );

    expect(series[0].expense).toBe(20);
  });

  it("buckets by Monday-anchored weeks", () => {
    // 2026-06-01 is a Monday.
    const series = toFlowSeries(
      [tx("EXPENSE", 10, "2026-06-03T09:00:00"), tx("EXPENSE", 20, "2026-06-10T09:00:00")],
      { ...ctx, from: new Date(2026, 5, 1), to: new Date(2026, 5, 14), bucket: "week" }
    );

    expect(series.map((p) => p.expense)).toEqual([10, 20]);
    expect(series[0].label).toBe("Jun 1");
    expect(series[1].label).toBe("Jun 8");
  });

  it("drops transactions outside the window instead of inventing buckets", () => {
    const series = toFlowSeries([tx("EXPENSE", 10, "2025-12-31T09:00:00")], {
      ...ctx,
      from: new Date(2026, 0, 1),
      to: new Date(2026, 0, 31),
      bucket: "day",
    });

    expect(series).toHaveLength(31);
    expect(series.every((p) => p.expense === 0)).toBe(true);
  });

  it("returns an empty series for an inverted range", () => {
    expect(
      toFlowSeries([], {
        ...ctx,
        from: new Date(2026, 5, 1),
        to: new Date(2026, 0, 1),
        bucket: "day",
      })
    ).toEqual([]);
  });
});

describe("bucketStart / nextBucketStart", () => {
  it("anchors weeks on Monday and strips the time of day", () => {
    const thursday = new Date(2026, 7, 27, 15, 30); // Aug 27 2026 is a Thursday
    expect(bucketStart(thursday, "week")).toEqual(new Date(2026, 7, 24));
    expect(bucketStart(thursday, "day")).toEqual(new Date(2026, 7, 27));
    expect(bucketStart(thursday, "month")).toEqual(new Date(2026, 7, 1));
  });

  it("steps to the next bucket", () => {
    expect(nextBucketStart(new Date(2026, 0, 1), "month")).toEqual(new Date(2026, 1, 1));
    expect(nextBucketStart(new Date(2026, 7, 24), "week")).toEqual(new Date(2026, 7, 31));
    expect(nextBucketStart(new Date(2026, 7, 31), "day")).toEqual(new Date(2026, 8, 1));
  });
});

describe("toFlowSeries cumulative", () => {
  const from = new Date(2026, 2, 1); // Mar 1
  const to = new Date(2026, 8, 6); // Sep 6
  const opts = {
    rates: IDENTITY_RATES,
    target: "USD" as Currency,
    from,
    to,
    bucket: "month" as const,
  };

  const salary = (iso: string) => tx("INCOME", 57_650, iso);

  it("carries a single income forward instead of dropping back to zero", () => {
    const series = toFlowSeries([salary("2026-03-23T12:00:00.000Z")], {
      ...opts,
      cumulative: true,
    });
    expect(series.map((p) => p.label)).toEqual(["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]);
    expect(series.map((p) => p.income)).toEqual(Array(7).fill(57_650));
    expect(series.map((p) => p.incomeAdded)).toEqual([57_650, 0, 0, 0, 0, 0, 0]);
  });

  it("steps up on each month that adds money and stays flat on the month in progress", () => {
    const series = toFlowSeries(
      [
        salary("2026-07-23T12:00:00.000Z"),
        salary("2026-08-23T12:00:00.000Z"),
        tx("EXPENSE", 1_000, "2026-09-02T12:00:00.000Z"),
      ],
      { ...opts, cumulative: true }
    );
    // September has no salary yet — the income line holds, never dips.
    expect(series.map((p) => p.income)).toEqual([0, 0, 0, 0, 57_650, 115_300, 115_300]);
    expect(series.map((p) => p.expense)).toEqual([0, 0, 0, 0, 0, 0, 1_000]);
    expect(series[6].expenseAdded).toBe(1_000);
  });

  it("leaves the per-bucket shape untouched by default", () => {
    const series = toFlowSeries([salary("2026-07-23T12:00:00.000Z")], opts);
    expect(series.map((p) => p.income)).toEqual([0, 0, 0, 0, 57_650, 0, 0]);
    expect(series[4].incomeAdded).toBeUndefined();
  });
});
