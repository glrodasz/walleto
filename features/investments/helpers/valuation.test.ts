import {
  costBasisAt,
  currentValue,
  dominantCategoryId,
  gainFromValue,
  latestValuationAt,
  matchesSelector,
  positionSign,
  selectorKey,
  valuationDomain,
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
const FUNDS = { domain: "INVESTMENT" as const };

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
    domain: "INVESTMENT",
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

  it("pools every unassigned row of the domain, skipping other domains, accounts and non-PAID rows", () => {
    const list = [
      tx(100, march),
      tx(50, march, { categoryId: "crypto" }),
      tx(999, march, { domain: "EXPENSE" }),
      tx(999, march, { status: "SKIPPED" }),
      tx(999, march, { accountId: "isk" }),
    ];
    expect(costBasisAt(list, FUNDS, may, ctx)).toBe(150);
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
  it("keys accounts and domain buckets apart", () => {
    expect(selectorKey({ accountId: "a" })).toBe("acc:a");
    expect(selectorKey({ domain: "SAVING" })).toBe("dom:SAVING");
  });

  it("matches the bucket only for rows of the domain without an account", () => {
    expect(matchesSelector({ domain: "SAVING" }, { domain: "SAVING" })).toBe(true);
    expect(matchesSelector({ domain: "SAVING", accountId: "a" }, { domain: "SAVING" })).toBe(false);
    expect(matchesSelector({ domain: "INVESTMENT" }, { domain: "SAVING" })).toBe(false);
    expect(matchesSelector({ domain: "SAVING", accountId: "a" }, { accountId: "a" })).toBe(true);
  });

  it("resolves a legacy valuation's domain through its category, defaulting to investments", () => {
    const cats = [{ id: "emergency", domain: "SAVING" as const }];
    expect(valuationDomain({ domain: "SAVING" }, [])).toBe("SAVING");
    expect(valuationDomain({ categoryId: "emergency" }, cats)).toBe("SAVING");
    expect(valuationDomain({ categoryId: "funds" }, cats)).toBe("INVESTMENT");
    expect(valuationDomain({}, [])).toBe("INVESTMENT");
    expect(valuationDomain({ categoryId: "visa" }, [{ id: "visa", domain: "DEBT" }])).toBe("DEBT");
  });

  it("signs a debt as a negative position", () => {
    expect(positionSign("INVESTMENT")).toBe(1);
    expect(positionSign("SAVING")).toBe(1);
    expect(positionSign("DEBT")).toBe(-1);
  });
});

describe("currentValue", () => {
  it("estimates with the account's rate when nothing was recorded, and adds later deposits to a check", () => {
    const start = new Date(2025, 0, 1);
    const list = [tx(1000, start, { accountId: "seb", domain: "SAVING" })];
    const rate = { value: 5, period: "YEARLY" as const };
    const estimate = currentValue(list, [], { accountId: "seb" }, rate, new Date(2026, 0, 1), ctx);
    expect(estimate).toBeCloseTo(1050, 0);

    const checks = [valuation(1030, new Date(2025, 6, 1), { accountId: "seb" })];
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

  it("reads a debt as what is owed: the balance less repayments since, nothing before a balance", () => {
    const visa = { accountId: "visa" };
    const repayments = [
      tx(500, new Date(2026, 1, 1), { ...visa, domain: "DEBT" }),
      tx(500, new Date(2026, 2, 1), { ...visa, domain: "DEBT" }),
    ];
    const balance = [valuation(5000, new Date(2026, 0, 1), { ...visa, domain: "DEBT" })];
    const apr = new Date(2026, 3, 1);
    expect(currentValue(repayments, balance, visa, undefined, apr, ctx, -1)).toBe(4000);
    // With a rate the balance compounds up while each repayment compounds down.
    const rate = { value: 12, period: "YEARLY" as const };
    expect(currentValue(repayments, balance, visa, rate, apr, ctx, -1)).toBeCloseTo(4127.5, 0);
    // Repayments alone say nothing about a balance: unknown reads as 0, never as an estimate.
    expect(currentValue(repayments, [], visa, rate, apr, ctx, -1)).toBe(0);
    expect(currentValue(repayments, balance, visa, rate, new Date(2025, 11, 1), ctx, -1)).toBe(0);
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

  it("charts a debt as repaid against owed, flat at 0 before the first balance", () => {
    const visa = { accountId: "visa" };
    const list = [
      tx(100, new Date(2026, 1, 10), { ...visa, domain: "DEBT" }),
      tx(100, new Date(2026, 3, 10), { ...visa, domain: "DEBT" }),
    ];
    const vals = [valuation(900, new Date(2026, 2, 20), { ...visa, domain: "DEBT" })];
    const series = valuationSeries(list, vals, visa, ctx, 6, now, undefined, -1);
    expect(series.map((p) => p.income)).toEqual([0, 100, 100, 200, 200, 200]);
    expect(series.map((p) => p.expense)).toEqual([0, 0, 900, 800, 800, 800]);
  });
});

describe("withdrawals and borrowing", () => {
  const coinbase = { accountId: "coinbase" };
  const apr = new Date(2026, 3, 1);

  it("a withdrawal lowers the cost basis and what a check carries forward", () => {
    const rows = [
      tx(1000, new Date(2026, 0, 10), { ...coinbase }),
      tx(400, new Date(2026, 2, 10), { ...coinbase, direction: "OUT" }),
    ];
    expect(costBasisAt(rows, coinbase, apr, ctx)).toBe(600);
    // No check: the position is what is net in.
    expect(currentValue(rows, [], coinbase, undefined, apr, ctx)).toBe(600);
    // A check before the withdrawal: carried forward, then the 400 leaves.
    const checks = [valuation(1500, new Date(2026, 1, 1), { ...coinbase })];
    expect(currentValue(rows, checks, coinbase, undefined, apr, ctx)).toBe(1100);
  });

  it("money borrowed on a debt raises what is owed", () => {
    const visa = { accountId: "visa" };
    const rows = [
      tx(300, new Date(2026, 1, 1), { ...visa, domain: "DEBT", direction: "OUT" }),
      tx(500, new Date(2026, 2, 1), { ...visa, domain: "DEBT" }),
    ];
    const balance = [valuation(5000, new Date(2026, 0, 1), { ...visa, domain: "DEBT" })];
    expect(currentValue(rows, balance, visa, undefined, apr, ctx, -1)).toBe(4800);
  });

  it("only money that came in decides the dominant category", () => {
    const cats = [
      { id: "funds", userId: "u1", domain: "INVESTMENT", name: "Funds" },
      { id: "crypto", userId: "u1", domain: "INVESTMENT", name: "Crypto" },
    ] as never;
    const rows = [
      tx(100, new Date(2026, 0, 1), { ...coinbase, categoryId: "funds" }),
      tx(900, new Date(2026, 0, 2), { ...coinbase, categoryId: "crypto", direction: "OUT" }),
    ];
    expect(dominantCategoryId(rows, coinbase, cats, ctx)).toBe("funds");
  });
});
