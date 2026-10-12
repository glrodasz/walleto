import {
  gainsByCategoryUntil,
  gainsByWindow,
  historyWindows,
  parseChartMeasure,
  runningTotals,
  unfiledGainUntil,
} from "./worthStack";
import type { GainRow } from "../../investments/helpers/valuationGains";

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
