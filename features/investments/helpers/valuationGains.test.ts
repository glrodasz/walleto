import {
  gainRowsAsTransactions,
  gainsByCategory,
  monthGains,
  unfiledGain,
  valuationGainRows,
} from "./valuationGains";
import { isSyntheticRow } from "../../domains/helpers/spread";
import {
  byAsOfAsc,
  costBasisAt,
  currentValue,
  latestValuationAt,
  selectorKey,
  valuationDomain,
  valuationSelector,
} from "./valuation";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type { ExchangeRates } from "../../../helpers/fx";
import type {
  Category,
  Currency,
  InvestmentValuation,
  Timestamp,
  Transaction,
} from "../../../types";

const ts = (date: Date): Timestamp => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
});

const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };

const check = (
  value: number,
  costBasis: number,
  date: Date,
  overrides: Partial<InvestmentValuation> = {}
): InvestmentValuation => ({
  userId: "u1",
  domain: "INVESTMENT",
  accountId: "acc-1",
  asOf: ts(date),
  gainPct: costBasis > 0 ? ((value - costBasis) / costBasis) * 100 : 0,
  value,
  costBasis,
  currency: "USD",
  ...overrides,
});

const tx = (amount: number, date: Date, overrides: Partial<Transaction> = {}): Transaction => ({
  userId: "u1",
  domain: "INVESTMENT",
  categoryId: "funds",
  accountId: "acc-1",
  name: "Index fund",
  amount,
  currency: "USD",
  occurredAt: ts(date),
  status: "PAID",
  ...overrides,
});

const category = (id: string, domain: Category["domain"], parentId?: string): Category => ({
  id,
  userId: "u1",
  domain,
  name: id,
  ...(parentId ? { parentId } : {}),
  createdAt: ts(new Date(2025, 0, 1)),
});

const dayBefore = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, 12);

/**
 * The deposits a chain's snapshotted bases stand for: per selector, oldest
 * first, one paid row of `costBasis_n − costBasis_{n−1}` the day before check
 * n, in the check's currency. The chain no longer reads the snapshot, so the
 * fixtures have to supply the money it used to imply.
 */
const depositsFromChecks = (
  checks: InvestmentValuation[],
  categories: Category[] = []
): Transaction[] => {
  const chains = new Map<string, InvestmentValuation[]>();
  for (const c of [...checks].sort(byAsOfAsc)) {
    const key = selectorKey(valuationSelector(c, categories));
    chains.set(key, [...(chains.get(key) ?? []), c]);
  }
  const out: Transaction[] = [];
  for (const chain of chains.values()) {
    let prev = 0;
    for (const c of chain) {
      const amount = c.costBasis - prev;
      if (amount !== 0) {
        out.push(
          tx(amount, dayBefore(c.asOf.toDate()), {
            accountId: c.accountId,
            domain: valuationDomain(c, categories),
            currency: c.currency,
          })
        );
      }
      prev = c.costBasis;
    }
  }
  return out;
};

/** Rows for `checks` against the deposits their bases imply. */
const gainsOf = (
  checks: InvestmentValuation[],
  domain: "INVESTMENT" | "SAVING" = "INVESTMENT",
  categories: Category[] = [],
  money = ctx
) => valuationGainRows(checks, depositsFromChecks(checks, categories), domain, categories, money);

const JAN = new Date(2026, 0, 15, 12);
const FEB = new Date(2026, 1, 15, 12);
const MAR = new Date(2026, 2, 15, 12);
const WINDOWS = [{ key: "2026-01" }, { key: "2026-02" }, { key: "2026-03" }];

describe("valuationGainRows", () => {
  it("books the first check's whole gain, then only each delta", () => {
    const rows = gainsOf([check(1100, 1000, JAN), check(1400, 1200, FEB)]);
    // 1100 on 1000 paid in = 100; then 1400 against 1100 carried + 200 since = 100.
    expect(rows.map((r) => r.gain)).toEqual([100, 100]);
  });

  it("telescopes: the gains of a chain add up to its last value minus what went in", () => {
    const checks = [check(1100, 1000, JAN), check(1400, 1200, FEB), check(1900, 1500, MAR)];
    const total = gainsOf(checks).reduce((s, r) => s + r.gain, 0);
    expect(total).toBeCloseTo(1900 - 1500);
  });

  it("reconciles with the Value view: contributions + gains = current value", () => {
    // Two contributions before the check, one after it.
    const transactions = [tx(1000, JAN), tx(200, FEB), tx(300, MAR)];
    const selector = { accountId: "acc-1" } as const;
    const now = new Date(2026, 2, 20);
    const checks = [check(1400, 1200, FEB)];

    const contributions = costBasisAt(transactions, selector, now, ctx);
    const gains = valuationGainRows(checks, transactions, "INVESTMENT", [], ctx).reduce(
      (s, r) => s + r.gain,
      0
    );

    // No interest rate, so the value view carries the check forward and adds
    // the deposits since: 1400 + 300 = 1700, and 1500 contributed + 200 gained.
    expect(contributions + gains).toBeCloseTo(
      currentValue(transactions, checks, selector, undefined, now, ctx)
    );
  });

  it("chains each account and the no-account bucket separately", () => {
    const rows = gainsOf([
      check(1100, 1000, JAN, { accountId: "acc-1" }),
      check(550, 500, JAN, { accountId: "acc-2" }),
      check(1400, 1200, FEB, { accountId: "acc-1" }),
      check(900, 800, FEB, { accountId: undefined }),
    ]);
    const bySelector = new Map(rows.map((r) => [`${r.selector}:${r.at.getMonth()}`, r.gain]));
    expect(bySelector.get("acc:acc-1:0")).toBe(100);
    expect(bySelector.get("acc:acc-2:0")).toBe(50);
    // acc-1's February delta is 1400 − (1100 + 200), untouched by acc-2 or the bucket.
    expect(bySelector.get("acc:acc-1:1")).toBe(100);
    expect(bySelector.get("dom:INVESTMENT:1")).toBe(100);
  });

  it("reports a loss as a negative gain, and the recovery as the full swing", () => {
    const rows = gainsOf([check(1100, 1000, JAN), check(900, 1000, FEB), check(1300, 1000, MAR)]);
    expect(rows.map((r) => r.gain)).toEqual([100, -200, 400]);
  });

  it("files a pre-accounts check under the domain its category names", () => {
    const categories = [category("pocket", "SAVING"), category("funds", "INVESTMENT")];
    const legacy = [
      check(1100, 1000, JAN, { domain: undefined, accountId: undefined, categoryId: "pocket" }),
      check(2200, 2000, JAN, { domain: undefined, accountId: undefined, categoryId: "funds" }),
    ];
    expect(gainsOf(legacy, "SAVING", categories).map((r) => r.gain)).toEqual([100]);
    expect(gainsOf(legacy, "INVESTMENT", categories).map((r) => r.gain)).toEqual([200]);
  });

  it("totals the same for two checks on one day whichever order they arrive in", () => {
    const a = check(1100, 1000, JAN, { id: "a" });
    const b = check(1250, 1000, JAN, { id: "b" });
    const sum = (rows: { gain: number }[]) => rows.reduce((s, r) => s + r.gain, 0);
    expect(sum(gainsOf([a, b]))).toBe(250);
    expect(sum(gainsOf([b, a]))).toBe(250);
  });

  it("ends on the same same-day check the Value view ends on", () => {
    const a = check(1100, 1000, JAN, { id: "a" });
    const b = check(1250, 1000, JAN, { id: "b" });
    const deposits = depositsFromChecks([a, b]);
    const selector = { accountId: "acc-1" } as const;
    const now = new Date(2026, 1, 1);
    for (const order of [
      [a, b],
      [b, a],
    ]) {
      expect(latestValuationAt(order, now)?.id).toBe("b");
      const value = currentValue(deposits, order, selector, undefined, now, ctx);
      expect(value).toBe(1250);
      const gains = valuationGainRows(order, deposits, "INVESTMENT", [], ctx).reduce(
        (s, r) => s + r.gain,
        0
      );
      expect(costBasisAt(deposits, selector, now, ctx) + gains).toBe(value);
    }
  });

  it("counts a deposit dated at the check as part of it, like the Value view does", () => {
    const aSecondLater = new Date(JAN.getTime() + 1000);
    const deposits = [tx(1000, JAN), tx(200, aSecondLater)];
    const checks = [check(1100, 1000, JAN), check(1400, 1200, FEB)];
    const rows = valuationGainRows(checks, deposits, "INVESTMENT", [], ctx);
    // The 1,000 is inside the first check; the 200 belongs to the second's window.
    expect(rows.map((r) => r.gain)).toEqual([100, 100]);
    // And at the first check's instant the position is worth the check, not the check plus the deposit again.
    expect(currentValue(deposits, checks, { accountId: "acc-1" }, undefined, JAN, ctx)).toBe(1100);
  });
});

describe("the identity holds under any exchange rate", () => {
  const withRates = (rates: Partial<Record<Currency, number>>, target: Currency) => ({
    target,
    rates: { ...IDENTITY_RATES, rates: { ...IDENTITY_RATES.rates, ...rates } } as ExchangeRates,
  });
  const sum = (rows: { gain: number }[]) => rows.reduce((s, r) => s + r.gain, 0);

  it("the screenshot: a USD-funded account read in SEK reconciles to the cent, on any day", () => {
    // Two USD deposits, both in September; two SEK checks whose snapshotted
    // bases were converted at the rate of their own day (deliberately stale).
    const deposits = [
      tx(2925, new Date(2026, 8, 1, 12), { categoryId: "stocks" }),
      tx(50, new Date(2026, 8, 15, 12), { categoryId: "stocks" }),
    ];
    const checks = [
      check(28744.1, 27305.17, new Date(2026, 8, 12, 12), {
        currency: "SEK",
        categoryId: "stocks",
      }),
      check(29042.25, 27778.49, new Date(2026, 8, 18, 12), {
        currency: "SEK",
        categoryId: "stocks",
      }),
    ];
    const cats = [category("stocks", "INVESTMENT")];
    const selector = { accountId: "acc-1" } as const;
    const now = new Date(2026, 8, 19, 12);

    // Today's rate: the 2,975 USD paid in read as SEK 27,680.26 on screen.
    const today = withRates({ SEK: 27680.26 / 2975 }, "SEK");
    const rows = valuationGainRows(checks, deposits, "INVESTMENT", cats, today);
    expect(sum(rows)).toBeCloseTo(1361.99, 2);
    const contributed = costBasisAt(deposits, selector, now, today);
    expect(contributed).toBeCloseTo(27680.26, 2);
    // What the Stocks row of Top categories shows this month: money in plus the gain filed under it.
    expect(contributed + gainsByCategory(rows, "2026-09").stocks).toBeCloseTo(29042.25, 2);
    expect(contributed + sum(rows)).toBeCloseTo(
      currentValue(deposits, checks, selector, undefined, now, today),
      6
    );

    // Tomorrow's rate: contributions move, the reconciliation does not.
    const tomorrow = withRates({ SEK: 9 }, "SEK");
    const later = valuationGainRows(checks, deposits, "INVESTMENT", cats, tomorrow);
    const contributedLater = costBasisAt(deposits, selector, now, tomorrow);
    expect(contributedLater).not.toBeCloseTo(contributed, 0);
    expect(contributedLater + sum(later)).toBeCloseTo(29042.25, 6);

    // The snapshot is not consulted: zero it out and nothing changes.
    const blank = checks.map((c) => ({ ...c, costBasis: 0 }));
    expect(valuationGainRows(blank, deposits, "INVESTMENT", cats, today)).toEqual(rows);
  });

  it("a two-currency chain read in a third currency still telescopes and reconciles", () => {
    const deposits = [
      tx(1000, new Date(2026, 0, 10, 12)),
      tx(500, new Date(2026, 1, 10, 12), { currency: "EUR" }),
      tx(200, new Date(2026, 2, 10, 12)),
    ];
    const checks = [
      check(950, 0, JAN, { currency: "EUR" }),
      check(1700, 0, FEB, { currency: "USD" }),
    ];
    const selector = { accountId: "acc-1" } as const;
    const now = new Date(2026, 2, 20);

    for (const money of [
      withRates({ EUR: 0.9, GBP: 0.8 }, "GBP"),
      withRates({ EUR: 0.95, GBP: 0.7 }, "GBP"),
    ]) {
      const rows = valuationGainRows(checks, deposits, "INVESTMENT", [], money);
      expect(costBasisAt(deposits, selector, now, money) + sum(rows)).toBeCloseTo(
        currentValue(deposits, checks, selector, undefined, now, money),
        6
      );
    }
    // Hand values at the first rate: 844.44 − 800, then 1360 − (844.44 + 444.44).
    const first = valuationGainRows(
      checks,
      deposits,
      "INVESTMENT",
      [],
      withRates({ EUR: 0.9, GBP: 0.8 }, "GBP")
    );
    expect(first.map((r) => Math.round(r.gain * 100) / 100)).toEqual([44.44, 71.11]);
  });
});

describe("monthGains", () => {
  const monthGainsOf = (checks: InvestmentValuation[]) =>
    monthGains(checks, depositsFromChecks(checks), "INVESTMENT", [], ctx, WINDOWS);

  it("returns every window key, zero where no check landed", () => {
    expect(monthGainsOf([check(1100, 1000, FEB)])).toEqual({
      "2026-01": 0,
      "2026-02": 100,
      "2026-03": 0,
    });
  });

  it("lets a check older than every window anchor the chain without adding a bar", () => {
    const old = check(1100, 1000, new Date(2025, 5, 1, 12));
    const gains = monthGainsOf([old, check(1400, 1200, FEB)]);
    // February reports only its delta over the anchor, not its whole 200.
    expect(gains["2026-02"]).toBe(100);
    expect(gains["2026-01"]).toBe(0);
  });

  it("sums several checks landing in the same month", () => {
    const gains = monthGainsOf([
      check(1100, 1000, new Date(2026, 1, 3, 12), { accountId: "acc-1" }),
      check(550, 500, new Date(2026, 1, 20, 12), { accountId: "acc-2" }),
    ]);
    expect(gains["2026-02"]).toBe(150);
  });
});

describe("filing a gain under a category", () => {
  const funds = category("funds", "INVESTMENT");
  const bonds = category("bonds", "INVESTMENT");
  const etfs = category("etfs", "INVESTMENT", "funds");
  const cats = [funds, bonds, etfs];

  it("carries the category the owner picked, folded to its root", () => {
    const rows = gainsOf(
      [
        check(1100, 1000, FEB, { categoryId: "etfs" }),
        check(600, 500, FEB, { accountId: "acc-2", categoryId: "bonds" }),
        check(900, 800, FEB, { accountId: "acc-3" }),
      ],
      "INVESTMENT",
      cats
    );
    expect(rows.map((r) => r.categoryId)).toEqual(["funds", "bonds", null]);
  });

  it("sums the month's gains per category and leaves the unfiled ones out", () => {
    const rows = gainsOf(
      [
        check(1100, 1000, FEB, { categoryId: "funds" }),
        check(650, 500, FEB, { accountId: "acc-2", categoryId: "funds" }),
        check(600, 500, FEB, { accountId: "acc-3", categoryId: "bonds" }),
        check(900, 800, FEB, { accountId: "acc-4" }),
        check(1300, 1000, MAR, { accountId: "acc-5", categoryId: "funds" }),
      ],
      "INVESTMENT",
      cats
    );
    expect(gainsByCategory(rows, "2026-02")).toEqual({ funds: 250, bonds: 100 });
    expect(unfiledGain(rows, "2026-02")).toBe(100);
    expect(gainsByCategory(rows, "2026-03")).toEqual({ funds: 300 });
    expect(unfiledGain(rows, "2026-03")).toBe(0);
  });

  it("adds up to the month's whole gain, filed and unfiled together", () => {
    const checks = [
      check(1100, 1000, FEB, { categoryId: "funds" }),
      check(900, 800, FEB, { accountId: "acc-4" }),
    ];
    const deposits = depositsFromChecks(checks, cats);
    const rows = valuationGainRows(checks, deposits, "INVESTMENT", cats, ctx);
    const filed = Object.values(gainsByCategory(rows, "2026-02")).reduce((s, g) => s + g, 0);
    expect(filed + unfiledGain(rows, "2026-02")).toBe(
      monthGains(checks, deposits, "INVESTMENT", cats, ctx, WINDOWS)["2026-02"]
    );
  });

  it("dresses filed gains as ledger rows, and never the unfiled ones", () => {
    const rows = gainsOf(
      [
        check(1100, 1000, FEB, { id: "v1", categoryId: "etfs" }),
        check(900, 800, FEB, { id: "v2", accountId: "acc-4" }),
      ],
      "INVESTMENT",
      cats
    );
    const ledger = gainRowsAsTransactions(rows, ctx);
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({ categoryId: "funds", amount: 100, currency: "USD" });
    // Marked synthetic so it never counts as a transaction of the month.
    expect(isSyntheticRow(ledger[0])).toBe(true);
    expect(ledger[0].occurredAt.toDate()).toEqual(FEB);
  });
});
