import { toCumulativeSeries } from "./domainChartData";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type { Currency } from "../../../types";

const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };

const ts = (date: Date) => ({ toDate: () => date });

const tx = (amount: number, date: Date, name = "Salary", currency: Currency = "USD") => ({
  amount,
  currency,
  occurredAt: ts(date),
  name,
});

describe("toCumulativeSeries", () => {
  const from = new Date(2026, 7, 20); // Aug 20
  const to = new Date(2026, 8, 2, 15); // Sep 2, 3pm

  it("fills every day of the window and carries the total forward", () => {
    const series = toCumulativeSeries([tx(57_650, new Date(2026, 7, 23))], ctx, {
      from,
      to,
      bucket: "day",
    });

    expect(series).toHaveLength(14); // Aug 20 … Sep 2
    expect(series[0]).toEqual({ label: "Aug 20", total: 0, added: 0, names: [] });
    expect(series[3]).toEqual({ label: "Aug 23", total: 57_650, added: 57_650, names: ["Salary"] });
    // Flat after the step, never back towards zero.
    expect(series[4].total).toBe(57_650);
    expect(series[13]).toMatchObject({ label: "Sep 2", total: 57_650, added: 0 });
  });

  it("adds a later transaction as a second step", () => {
    const series = toCumulativeSeries(
      [tx(57_650, new Date(2026, 7, 23)), tx(625, new Date(2026, 8, 2, 9), "Bonus")],
      ctx,
      { from, to, bucket: "day" }
    );
    expect(series[13]).toEqual({ label: "Sep 2", total: 58_275, added: 625, names: ["Bonus"] });
  });

  it("buckets by Monday-anchored week and lists every name in the bucket", () => {
    const series = toCumulativeSeries(
      [tx(100, new Date(2026, 7, 25), "A"), tx(50, new Date(2026, 7, 27), "B")],
      ctx,
      { from: new Date(2026, 7, 24), to: new Date(2026, 8, 7), bucket: "week" }
    );
    expect(series.map((p) => p.label)).toEqual(["Aug 24", "Aug 31", "Sep 7"]);
    expect(series[0]).toMatchObject({ added: 150, total: 150, names: ["A", "B"] });
    expect(series[2].total).toBe(150);
  });

  it("converts each transaction into the reporting currency", () => {
    const rates = {
      base: "USD" as const,
      rates: { USD: 1, EUR: 0.5, MXN: 1, GBP: 1, SEK: 1, CHF: 1, JPY: 1, COP: 1 },
      fetchedAt: "2026-08-01T00:00:00.000Z",
    };
    const series = toCumulativeSeries(
      [tx(100, new Date(2026, 7, 21), "Retainer", "EUR")],
      {
        rates,
        target: "USD",
      },
      { from, to, bucket: "day" }
    );
    expect(series[1].total).toBe(200);
  });

  it("accepts ISO strings for occurredAt and ignores rows outside the window", () => {
    const series = toCumulativeSeries(
      [
        { amount: 10, currency: "USD", occurredAt: "2026-08-21T12:00:00.000Z", name: "In" },
        { amount: 99, currency: "USD", occurredAt: "2026-07-01T12:00:00.000Z", name: "Out" },
      ],
      ctx,
      { from, to, bucket: "day" }
    );
    expect(series.at(-1)?.total).toBe(10);
  });

  it("is an all-zero flat line for an empty period, and empty when to < from", () => {
    const flat = toCumulativeSeries([], ctx, { from, to, bucket: "day" });
    expect(flat.every((p) => p.total === 0)).toBe(true);
    expect(toCumulativeSeries([], ctx, { from: to, to: from, bucket: "day" })).toEqual([]);
  });
});
