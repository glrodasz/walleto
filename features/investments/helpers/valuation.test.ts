import {
  costBasisAt,
  currentValue,
  gainFromValue,
  latestValuationAt,
  matchesSelector,
  selectorKey,
  valueFromGain,
  valuationSeries,
} from "./valuation";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type { Currency, InvestmentValuation, Timestamp, Transaction } from "../../../types";

const ts = (date: Date): Timestamp => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
});

const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };
const FUNDS = { categoryId: "funds" };

const tx = (amount: number, date: Date, overrides: Partial<Transaction> = {}): Transaction => ({
  userId: "u1",
  domain: "INVESTMENT",
  categoryId: "funds",
  name: "Index fund",
  amount,
  currency: "USD",
  occurredAt: ts(date),
  status: "PAID",
  ...overrides,
});

const valuation = (value: number, date: Date, overrides: Partial<InvestmentValuation> = {}) =>
  ({
    userId: "u1",
    categoryId: "funds",
    asOf: ts(date),
    gainPct: 0,
    value,
    costBasis: 0,
    currency: "USD",
    ...overrides,
  }) as InvestmentValuation;

describe("valueFromGain / gainFromValue", () => {
  it("treats 0% as break-even and +100% as doubling", () => {
    expect(valueFromGain(130, 0)).toBe(130);
    expect(valueFromGain(130, 100)).toBe(260);
    expect(valueFromGain(130, -20)).toBe(104);
  });

  it("inverts: the owner's example, 130 invested worth 230, is +76.9%", () => {
    expect(gainFromValue(130, 230)).toBeCloseTo(76.92, 1);
    expect(gainFromValue(130, 130)).toBe(0);
  });

  it("has no gain without a basis", () => {
    expect(gainFromValue(0, 100)).toBeNull();
  });
});

describe("costBasisAt", () => {
  const march = new Date(2026, 2, 1);
  const april = new Date(2026, 3, 1);
  const may = new Date(2026, 4, 1);

  it("sums PAID investment transactions of the category up to the date", () => {
    const list = [tx(100, march), tx(10, april), tx(10, may)];
    expect(costBasisAt(list, FUNDS, new Date(2026, 3, 15), ctx)).toBe(110);
    expect(costBasisAt(list, FUNDS, new Date(2026, 5, 1), ctx)).toBe(120);
  });

  it("ignores other categories, other domains and non-PAID rows", () => {
    const list = [
      tx(100, march),
      tx(999, march, { categoryId: "crypto" }),
      tx(999, march, { domain: "EXPENSE" }),
      tx(999, march, { status: "SKIPPED" }),
      tx(999, march, { accountId: "isk" }),
    ];
    expect(costBasisAt(list, FUNDS, may, ctx)).toBe(100);
  });

  it("counts savings deposits too, and selects by account across categories", () => {
    const list = [
      tx(50, march, { domain: "SAVING", accountId: "seb", categoryId: "emergency" }),
      tx(25, april, { domain: "SAVING", accountId: "seb", categoryId: "trip" }),
      tx(999, march, { domain: "SAVING", categoryId: "emergency" }),
    ];
    expect(costBasisAt(list, { accountId: "seb" }, may, ctx)).toBe(75);
  });
});

describe("selectors", () => {
  it("keys accounts and categories apart", () => {
    expect(selectorKey({ accountId: "a" })).toBe("acc:a");
    expect(selectorKey({ categoryId: "c" })).toBe("cat:c");
  });

  it("matches a category only for rows without an account", () => {
    expect(matchesSelector({ categoryId: "c" }, { categoryId: "c" })).toBe(true);
    expect(matchesSelector({ categoryId: "c", accountId: "a" }, { categoryId: "c" })).toBe(false);
    expect(matchesSelector({ categoryId: "c", accountId: "a" }, { accountId: "a" })).toBe(true);
  });
});

describe("currentValue", () => {
  it("estimates with the account's rate when nothing was recorded, and adds later deposits to a check", () => {
    const start = new Date(2025, 0, 1);
    const list = [tx(1000, start, { accountId: "seb", domain: "SAVING" })];
    const rate = { value: 5, period: "YEARLY" as const };
    const estimate = currentValue(list, [], { accountId: "seb" }, rate, new Date(2026, 0, 1), ctx);
    expect(estimate).toBeCloseTo(1050, 0);

    const checks = [
      valuation(1030, new Date(2025, 6, 1), { accountId: "seb", categoryId: undefined }),
    ];
    const later = [...list, tx(100, new Date(2025, 9, 1), { accountId: "seb", domain: "SAVING" })];
    const withCheck = currentValue(
      later,
      checks,
      { accountId: "seb" },
      undefined,
      new Date(2026, 0, 1),
      ctx
    );
    expect(withCheck).toBe(1130);
  });
});

describe("latestValuationAt", () => {
  it("picks the newest valuation on or before the date", () => {
    const a = valuation(150, new Date(2026, 1, 1));
    const b = valuation(200, new Date(2026, 3, 1));
    const later = valuation(300, new Date(2026, 6, 1));
    expect(latestValuationAt([later, a, b], new Date(2026, 4, 1))).toBe(b);
    expect(latestValuationAt([a, b], new Date(2026, 0, 1))).toBeNull();
  });
});

describe("valuationSeries", () => {
  const now = new Date(2026, 5, 15); // mid-June

  it("carries the last valuation forward and tracks invested cumulatively", () => {
    const list = [
      tx(100, new Date(2026, 0, 10)),
      tx(10, new Date(2026, 1, 10)),
      tx(10, new Date(2026, 2, 10)),
    ];
    const vals = [valuation(260, new Date(2026, 2, 20))];

    const series = valuationSeries(list, vals, FUNDS, ctx, 6, now);

    expect(series.map((p) => p.label)).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);
    expect(series.map((p) => p.income)).toEqual([100, 110, 120, 120, 120, 120]);
    // No valuation yet in Jan/Feb → value equals invested; then 260 carried forward.
    expect(series.map((p) => p.expense)).toEqual([100, 110, 260, 260, 260, 260]);
  });

  it("converts a valuation recorded in another currency into the target", () => {
    const rates = {
      base: "USD" as const,
      rates: { USD: 1, EUR: 0.5, MXN: 1, GBP: 1, SEK: 1, CHF: 1, JPY: 1, COP: 1 },
      fetchedAt: "2026-06-01T00:00:00.000Z",
    };
    const vals = [valuation(100, new Date(2026, 4, 1), { currency: "EUR" })];
    const series = valuationSeries([], vals, FUNDS, { rates, target: "USD" }, 2, now);
    expect(series[1].expense).toBe(200);
  });
});
