import { isSubscription, subscriptionCosts } from "./subscriptionCosts";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type { Currency, Timestamp } from "../../../types";

const ts = (iso: string): Timestamp => {
  const date = new Date(iso);
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => date,
  };
};

const categories = [
  { id: "cat-subs", name: "Subscriptions" },
  { id: "cat-home", name: "Home & Family" },
];

const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };

const item = (overrides: Record<string, unknown> = {}) => ({
  id: "item1",
  userId: "u1",
  domain: "EXPENSE" as const,
  categoryId: "cat-subs",
  name: "Netflix",
  amount: 16,
  currency: "USD" as Currency,
  frequency: "MONTHLY" as const,
  startDate: ts("2026-01-01T00:00:00.000Z"),
  active: true,
  ...overrides,
});

describe("isSubscription", () => {
  it("matches an explicit SUBSCRIPTION type", () => {
    expect(isSubscription({ type: "SUBSCRIPTION", categoryId: "cat-home" }, categories)).toBe(true);
  });

  it("matches the Subscriptions category when type is unset", () => {
    expect(isSubscription({ categoryId: "cat-subs" }, categories)).toBe(true);
  });

  it("is case-insensitive on the category name", () => {
    expect(isSubscription({ categoryId: "x" }, [{ id: "x", name: "  subscriptions  " }])).toBe(
      true
    );
  });

  it("rejects anything else", () => {
    expect(isSubscription({ type: "OTHER", categoryId: "cat-home" }, categories)).toBe(false);
  });
});

describe("subscriptionCosts", () => {
  it("filters to subscriptions only and sorts priciest first", () => {
    const items = [
      item({ id: "cheap", name: "Spotify", amount: 10 }),
      item({ id: "pricey", name: "Netflix", amount: 20 }),
      item({ id: "not-a-sub", categoryId: "cat-home", name: "Rent", amount: 1000 }),
    ];

    const result = subscriptionCosts(items, categories, ctx);

    expect(result.items.map((i) => i.name)).toEqual(["Netflix", "Spotify"]);
    expect(result.totalMonthly).toBe(30);
    expect(result.totalAnnualized).toBe(360);
  });

  it("annualizes and monthly-normalizes non-monthly frequencies", () => {
    const items = [item({ amount: 120, frequency: "YEARLY" })];
    const result = subscriptionCosts(items, categories, ctx);

    expect(result.items[0].monthlyAmount).toBeCloseTo(10);
    expect(result.items[0].annualizedAmount).toBeCloseTo(120);
  });

  it("computes percent of income only when income is known", () => {
    const items = [item({ amount: 50 })];

    const withIncome = subscriptionCosts(items, categories, ctx, 1000);
    expect(withIncome.percentOfIncome).toBeCloseTo(5);

    const withoutIncome = subscriptionCosts(items, categories, ctx, 0);
    expect(withoutIncome.percentOfIncome).toBeNull();
  });

  it("computes the implied rate from a charged pair", () => {
    const items = [item({ amount: 16, chargedAmount: 64000, chargedCurrency: "COP" })];
    const result = subscriptionCosts(items, categories, ctx);
    expect(result.items[0].impliedRate).toBe(4000);
  });

  it("leaves impliedRate null without a charged pair", () => {
    const result = subscriptionCosts([item()], categories, ctx);
    expect(result.items[0].impliedRate).toBeNull();
  });

  it("surfaces nextOccurrence as a Date, or null when absent", () => {
    const withNext = subscriptionCosts(
      [item({ nextOccurrence: ts("2026-04-01T00:00:00.000Z") })],
      categories,
      ctx
    );
    expect(withNext.items[0].nextOccurrence).toEqual(new Date("2026-04-01T00:00:00.000Z"));

    const withoutNext = subscriptionCosts([item()], categories, ctx);
    expect(withoutNext.items[0].nextOccurrence).toBeNull();
  });

  it("returns zeroed totals for an empty subscription set", () => {
    const result = subscriptionCosts([], categories, ctx);
    expect(result).toEqual({
      items: [],
      totalMonthly: 0,
      totalAnnualized: 0,
      percentOfIncome: null,
    });
  });
});
