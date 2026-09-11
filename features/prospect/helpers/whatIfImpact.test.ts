import { computeWhatIfImpact } from "./whatIfImpact";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type { Currency } from "../../../types";

const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };

const item = (overrides: Record<string, unknown> = {}) => ({
  id: "item1",
  userId: "u1",
  domain: "EXPENSE" as const,
  categoryId: "cat1",
  name: "Netflix",
  amount: 16,
  currency: "USD" as Currency,
  frequency: "MONTHLY" as const,
  startDate: { seconds: 0, nanoseconds: 0, toDate: () => new Date(0) },
  active: true,
  ...overrides,
});

describe("computeWhatIfImpact", () => {
  it("sums the monthly amount of only the excluded items", () => {
    const items = [
      item({ id: "a", name: "Netflix", amount: 16 }),
      item({ id: "b", name: "Spotify", amount: 10 }),
      item({ id: "c", name: "Rent", amount: 1000 }),
    ];
    const result = computeWhatIfImpact(items, new Set(["a", "b"]), ctx);

    expect(result.freedMonthly).toBe(26);
    expect(result.freedAnnual).toBe(312);
    expect(result.excludedNames).toEqual(["Netflix", "Spotify"]);
  });

  it("returns zero impact when nothing is excluded", () => {
    const result = computeWhatIfImpact([item()], new Set(), ctx);
    expect(result).toEqual({ freedMonthly: 0, freedAnnual: 0, excludedNames: [] });
  });

  it("normalizes non-monthly frequencies before summing", () => {
    const items = [item({ id: "yearly", amount: 120, frequency: "YEARLY" })];
    const result = computeWhatIfImpact(items, new Set(["yearly"]), ctx);
    expect(result.freedMonthly).toBeCloseTo(10);
  });

  it("ignores ids that don't match any item", () => {
    const result = computeWhatIfImpact([item({ id: "a" })], new Set(["ghost"]), ctx);
    expect(result.freedMonthly).toBe(0);
  });
});
