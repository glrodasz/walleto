import {
  gainsByCategoryUntil,
  gainsByWindow,
  historyWindows,
  parseChartMeasure,
  parseSummaryScope,
  runningTotals,
  unfiledGainUntil,
  worthLedger,
  worthUntil,
} from "./worthStack";
import type { GainRow } from "../../investments/helpers/valuationGains";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type { Currency, Transaction } from "../../../types";

const gain = (at: string, value: number, categoryId: string | null = null): GainRow => ({
  selector: "acc:a",
  at: new Date(at),
  gain: value,
  currency: "USD",
  categoryId,
});

describe("parseChartMeasure", () => {
  it("defaults to worth for anything but a stored activity", () => {
    expect(parseChartMeasure('"activity"')).toBe("activity");
    expect(parseChartMeasure('"worth"')).toBe("worth");
    expect(parseChartMeasure('"nonsense"')).toBe("worth");
    expect(parseChartMeasure("not json")).toBe("worth");
  });
});

describe("historyWindows", () => {
  const now = new Date(2026, 9, 12);

  it("reaches back to the earliest date's month", () => {
    const wins = historyWindows([new Date(2025, 11, 20), new Date(2026, 5, 1)], now, 3);
    expect(wins.map((w) => w.key)).toEqual([
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
  });

  it("never returns fewer windows than the chart draws", () => {
    expect(historyWindows([new Date(2026, 9, 1)], now, 6)).toHaveLength(6);
    expect(historyWindows([], now, 6)).toHaveLength(6);
  });
});

describe("runningTotals", () => {
  it("carries each series forward, so a month with no flow keeps its balance", () => {
    const windows = [{ key: "a" }, { key: "b" }, { key: "c" }];
    const out = runningTotals(
      {
        series: [
          { key: "stocks", label: "Stocks", color: "x" },
          { key: "__gain", label: "Gain", color: "y" },
        ],
        totals: {
          a: { stocks: 100, __gain: 0 },
          b: { stocks: 0, __gain: 10 },
          c: { stocks: -30, __gain: -5 },
        },
      },
      windows
    );
    expect(out.totals).toEqual({
      a: { stocks: 100, __gain: 0 },
      b: { stocks: 100, __gain: 10 },
      c: { stocks: 70, __gain: 5 },
    });
  });
});

describe("gains by window and by date", () => {
  const rows = [
    gain("2026-08-15T12:00:00", 50, "stocks"),
    gain("2026-09-10T12:00:00", -20, "stocks"),
    gain("2026-09-20T12:00:00", 7),
  ];

  it("sums per month, optionally only the unfiled ones", () => {
    const windows = [{ key: "2026-08" }, { key: "2026-09" }];
    expect(gainsByWindow(rows, windows)).toEqual({ "2026-08": 50, "2026-09": -13 });
    expect(gainsByWindow(rows, windows, true)).toEqual({ "2026-08": 0, "2026-09": 7 });
  });

  it("adds up everything reported before a date", () => {
    const end = new Date(2026, 8, 15);
    expect(gainsByCategoryUntil(rows, end)).toEqual({ stocks: 30 });
    expect(unfiledGainUntil(rows, end)).toBe(0);
    expect(unfiledGainUntil(rows, new Date(2026, 9, 1))).toBe(7);
  });
});

describe("parseSummaryScope", () => {
  it("defaults to the month for anything but a stored total", () => {
    expect(parseSummaryScope('"total"')).toBe("total");
    expect(parseSummaryScope('"month"')).toBe("month");
    expect(parseSummaryScope("not json")).toBe("month");
  });
});

describe("worthLedger / worthUntil", () => {
  const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };
  const row = (amount: number, date: Date, overrides: Partial<Transaction> = {}): Transaction => ({
    userId: "u1",
    domain: "DEBT",
    categoryId: "cards",
    accountId: "visa",
    name: "Card payment",
    amount,
    currency: "USD",
    occurredAt: { seconds: 0, nanoseconds: 0, toDate: () => date },
    status: "PAID",
    ...overrides,
  });
  const check = (at: Date, value: number, categoryId: string | null = "cards"): GainRow => ({
    selector: "acc:visa",
    at,
    gain: value,
    currency: "USD",
    categoryId,
  });

  it("keeps every row of an asset", () => {
    const rows = [row(100, new Date(2026, 0, 1), { domain: "SAVING" })];
    expect(worthLedger(rows, [], "SAVING")).toBe(rows);
  });

  it("builds a debt's worth from its first balance on, and drops a debt nobody checked", () => {
    const rows = [
      row(300, new Date(2025, 11, 1)), // before the first balance: already in it
      row(500, new Date(2026, 1, 1)),
      row(500, new Date(2026, 2, 1)),
      row(900, new Date(2026, 2, 1), { accountId: "car" }), // no balance ever recorded
    ];
    // 5,000 owed on Jan 1 (anchored), 1,100 of interest revealed on Apr 1.
    const gains = [check(new Date(2026, 0, 1), -5000), check(new Date(2026, 3, 1), -1100)];
    const ledger = worthLedger(rows, gains, "DEBT");
    expect(ledger.map((t) => t.amount)).toEqual([500, 500]);

    expect(worthUntil(ledger, gains, new Date(2026, 0, 1), ctx)).toBe(0);
    expect(worthUntil(ledger, gains, new Date(2026, 2, 15), ctx)).toBe(-4000);
    expect(worthUntil(ledger, gains, new Date(2026, 4, 1), ctx)).toBe(-5100);
  });

  it("leaves hidden categories out, rows and filed gains alike", () => {
    const rows = [
      row(100, new Date(2026, 0, 5), { domain: "INVESTMENT", categoryId: "stocks" }),
      row(40, new Date(2026, 0, 5), { domain: "INVESTMENT", categoryId: "crypto" }),
    ];
    const gains = [
      check(new Date(2026, 0, 20), 10, "stocks"),
      check(new Date(2026, 0, 20), 5, "crypto"),
      check(new Date(2026, 0, 20), 1, null),
    ];
    const end = new Date(2026, 1, 1);
    expect(worthUntil(rows, gains, end, ctx)).toBe(156);
    expect(worthUntil(rows, gains, end, ctx, new Set(["crypto"]))).toBe(111);
  });
});
