import { IDENTITY_RATES } from "./fx";
import { OTHER_KEY, domainTint, monthTotalsBy, monthTotalsByCategory } from "./stacks";
import type { Category } from "../types";

const ctx = { rates: IDENTITY_RATES, target: "USD" as const };
const windows = [{ key: "2026-08" }, { key: "2026-09" }];

const row = (occurredAt: Date, amount: number, categoryId: string, currency = "USD" as const) => ({
  occurredAt,
  amount,
  currency,
  categoryId,
});

const cats = [
  { id: "home", name: "Home", domain: "EXPENSE" },
  { id: "rent", name: "Rent", domain: "EXPENSE", parentId: "home" },
  { id: "fun", name: "Fun", domain: "EXPENSE" },
  { id: "food", name: "Food", domain: "EXPENSE" },
] as Category[];

describe("monthTotalsBy", () => {
  it("splits each month by key, ranks by grand total and zero-fills", () => {
    const rows = [
      row(new Date(2026, 7, 3), 10, "a"),
      row(new Date(2026, 8, 3), 5, "a"),
      row(new Date(2026, 8, 9), 40, "b"),
      row(new Date(2026, 5, 1), 999, "a"), // outside the windows
    ];
    const out = monthTotalsBy(rows, ctx, windows, (r) => r.categoryId, {
      label: (k) => k.toUpperCase(),
      color: (i) => `c${i}`,
    });
    expect(out.series).toEqual([
      { key: "b", label: "B", color: "c0" },
      { key: "a", label: "A", color: "c1" },
    ]);
    expect(out.totals).toEqual({
      "2026-08": { b: 0, a: 10 },
      "2026-09": { b: 40, a: 5 },
    });
  });

  it("folds everything past the cap into Other", () => {
    const rows = [
      row(new Date(2026, 8, 1), 50, "a"),
      row(new Date(2026, 8, 1), 30, "b"),
      row(new Date(2026, 8, 1), 20, "c"),
      row(new Date(2026, 8, 1), 10, "d"),
    ];
    const out = monthTotalsBy(rows, ctx, windows, (r) => r.categoryId, {
      top: 2,
      label: (k) => k,
      color: (i) => `c${i}`,
      otherColor: "grey",
    });
    expect(out.series.map((s) => s.key)).toEqual(["a", "b", OTHER_KEY]);
    expect(out.series[2].color).toBe("grey");
    expect(out.totals["2026-09"]).toEqual({ a: 50, b: 30, [OTHER_KEY]: 30 });
  });
});

describe("monthTotalsByCategory", () => {
  it("folds children into their root and names the slices", () => {
    const rows = [
      row(new Date(2026, 8, 1), 100, "rent"),
      row(new Date(2026, 8, 2), 20, "home"),
      row(new Date(2026, 8, 3), 30, "fun"),
      row(new Date(2026, 8, 4), 5, "ghost"),
    ];
    const out = monthTotalsByCategory(rows, cats, ctx, windows, { domain: "EXPENSE" });
    expect(out.series.map((s) => [s.key, s.label, s.color])).toEqual([
      ["home", "Home", "var(--tint-expense-1)"],
      ["fun", "Fun", "var(--tint-expense-2)"],
      ["ghost", "Unknown", "var(--tint-expense-3)"],
    ]);
    expect(out.totals["2026-09"].home).toBe(120);
  });

  it("keeps five slices and an Other by default", () => {
    const rows = ["a", "b", "c", "d", "e", "f", "g"].map((k, i) =>
      row(new Date(2026, 8, 1), 100 - i, k)
    );
    const out = monthTotalsByCategory(rows, [], ctx, windows, { domain: "INCOME" });
    expect(out.series).toHaveLength(6);
    expect(out.series[5]).toEqual({
      key: OTHER_KEY,
      label: "Other",
      color: "var(--tint-income-6)",
    });
  });
});

describe("domainTint", () => {
  it("never runs past the six ramp steps", () => {
    expect(domainTint("SAVING", 0)).toBe("var(--tint-saving-1)");
    expect(domainTint("SAVING", 9)).toBe("var(--tint-saving-6)");
  });
});
