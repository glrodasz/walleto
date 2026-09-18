import {
  gainRowsAsTransactions,
  gainsByCategory,
  monthGains,
  unfiledGain,
  valuationGainRows,
} from "./valuationGains";
import { isSyntheticRow } from "../../domains/helpers/spread";
import { costBasisAt, currentValue } from "./valuation";
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

const JAN = new Date(2026, 0, 15);
const FEB = new Date(2026, 1, 15);
const MAR = new Date(2026, 2, 15);
const WINDOWS = [{ key: "2026-01" }, { key: "2026-02" }, { key: "2026-03" }];

describe("valuationGainRows", () => {
  it("books the first check's whole gain, then only each delta", () => {
    const rows = valuationGainRows(
      [check(1100, 1000, JAN), check(1400, 1200, FEB)],
      "INVESTMENT",
      [],
      ctx
    );
    // 1100 − 1000 = 100, then (1400 − 1200) − 100 = 100.
    expect(rows.map((r) => r.gain)).toEqual([100, 100]);
  });

  it("telescopes: the gains of a chain add up to its last check's net gain", () => {
    const checks = [check(1100, 1000, JAN), check(1400, 1200, FEB), check(1900, 1500, MAR)];
    const total = valuationGainRows(checks, "INVESTMENT", [], ctx).reduce((s, r) => s + r.gain, 0);
    expect(total).toBeCloseTo(1900 - 1500);
  });

  it("reconciles with the Value view: contributions + gains = current value", () => {
    // Two contributions before the check, one after it.
    const transactions = [tx(1000, JAN), tx(200, FEB), tx(300, MAR)];
    const selector = { accountId: "acc-1" } as const;
    const now = new Date(2026, 2, 20);
    const checks = [check(1400, 1200, FEB)];

    const contributions = costBasisAt(transactions, selector, now, ctx);
    const gains = valuationGainRows(checks, "INVESTMENT", [], ctx).reduce((s, r) => s + r.gain, 0);

    // No interest rate, so the value view carries the check forward and adds
    // the deposits since: 1400 + 300 = 1700, and 1500 contributed + 200 gained.
    expect(contributions + gains).toBeCloseTo(
      currentValue(transactions, checks, selector, undefined, now, ctx)
    );
  });

  it("chains each account and the no-account bucket separately", () => {
    const rows = valuationGainRows(
      [
        check(1100, 1000, JAN, { accountId: "acc-1" }),
        check(550, 500, JAN, { accountId: "acc-2" }),
        check(1400, 1200, FEB, { accountId: "acc-1" }),
        check(900, 800, FEB, { accountId: undefined }),
      ],
      "INVESTMENT",
      [],
      ctx
    );
    const bySelector = new Map(rows.map((r) => [`${r.selector}:${r.at.getMonth()}`, r.gain]));
    expect(bySelector.get("acc:acc-1:0")).toBe(100);
    expect(bySelector.get("acc:acc-2:0")).toBe(50);
    // acc-1's February delta is 200 − 100, untouched by acc-2 or the bucket.
    expect(bySelector.get("acc:acc-1:1")).toBe(100);
    expect(bySelector.get("dom:INVESTMENT:1")).toBe(100);
  });

  it("reports a loss as a negative gain, and the recovery as the full swing", () => {
    const rows = valuationGainRows(
      [check(1100, 1000, JAN), check(900, 1000, FEB), check(1300, 1000, MAR)],
      "INVESTMENT",
      [],
      ctx
    );
    expect(rows.map((r) => r.gain)).toEqual([100, -200, 400]);
  });

  it("converts each check from its own currency before subtracting", () => {
    // 0.5 EUR per USD, so one euro is worth two dollars.
    const rates: ExchangeRates = {
      ...IDENTITY_RATES,
      rates: { ...IDENTITY_RATES.rates, EUR: 0.5 },
    };
    const mixed = { rates, target: "USD" as Currency };
    const rows = valuationGainRows(
      [
        // 550 − 500 EUR = 50 EUR = 100 USD.
        check(550, 500, JAN, { currency: "EUR" }),
        check(1400, 1200, FEB, { currency: "USD" }),
      ],
      "INVESTMENT",
      [],
      mixed
    );
    expect(rows[0].gain).toBeCloseTo(100);
    expect(rows[1].gain).toBeCloseTo(100);
    expect(rows[0].currency).toBe("EUR");
  });

  it("files a pre-accounts check under the domain its category names", () => {
    const categories = [category("pocket", "SAVING"), category("funds", "INVESTMENT")];
    const legacy = [
      check(1100, 1000, JAN, { domain: undefined, accountId: undefined, categoryId: "pocket" }),
      check(2200, 2000, JAN, { domain: undefined, accountId: undefined, categoryId: "funds" }),
    ];
    expect(valuationGainRows(legacy, "SAVING", categories, ctx).map((r) => r.gain)).toEqual([100]);
    expect(valuationGainRows(legacy, "INVESTMENT", categories, ctx).map((r) => r.gain)).toEqual([
      200,
    ]);
  });

  it("totals the same for two checks on one day whichever order they arrive in", () => {
    const a = check(1100, 1000, JAN, { id: "a" });
    const b = check(1250, 1000, JAN, { id: "b" });
    const sum = (rows: { gain: number }[]) => rows.reduce((s, r) => s + r.gain, 0);
    expect(sum(valuationGainRows([a, b], "INVESTMENT", [], ctx))).toBe(250);
    expect(sum(valuationGainRows([b, a], "INVESTMENT", [], ctx))).toBe(250);
  });
});

describe("monthGains", () => {
  it("returns every window key, zero where no check landed", () => {
    expect(monthGains([check(1100, 1000, FEB)], "INVESTMENT", [], ctx, WINDOWS)).toEqual({
      "2026-01": 0,
      "2026-02": 100,
      "2026-03": 0,
    });
  });

  it("lets a check older than every window anchor the chain without adding a bar", () => {
    const old = check(1100, 1000, new Date(2025, 5, 1));
    const gains = monthGains([old, check(1400, 1200, FEB)], "INVESTMENT", [], ctx, WINDOWS);
    // February reports only its delta over the anchor, not its whole 200.
    expect(gains["2026-02"]).toBe(100);
  });

  it("sums several checks landing in the same month", () => {
    const gains = monthGains(
      [
        check(1100, 1000, new Date(2026, 1, 3), { accountId: "acc-1" }),
        check(550, 500, new Date(2026, 1, 20), { accountId: "acc-2" }),
      ],
      "INVESTMENT",
      [],
      ctx,
      WINDOWS
    );
    expect(gains["2026-02"]).toBe(150);
  });
});

describe("filing a gain under a category", () => {
  const funds = category("funds", "INVESTMENT");
  const bonds = category("bonds", "INVESTMENT");
  const etfs = category("etfs", "INVESTMENT", "funds");
  const cats = [funds, bonds, etfs];

  it("carries the category the owner picked, folded to its root", () => {
    const rows = valuationGainRows(
      [
        check(1100, 1000, FEB, { categoryId: "etfs" }),
        check(600, 500, FEB, { accountId: "acc-2", categoryId: "bonds" }),
        check(900, 800, FEB, { accountId: "acc-3" }),
      ],
      "INVESTMENT",
      cats,
      ctx
    );
    expect(rows.map((r) => r.categoryId)).toEqual(["funds", "bonds", null]);
  });

  it("sums the month's gains per category and leaves the unfiled ones out", () => {
    const rows = valuationGainRows(
      [
        check(1100, 1000, FEB, { categoryId: "funds" }),
        check(650, 500, FEB, { accountId: "acc-2", categoryId: "funds" }),
        check(600, 500, FEB, { accountId: "acc-3", categoryId: "bonds" }),
        check(900, 800, FEB, { accountId: "acc-4" }),
        check(1300, 1000, MAR, { accountId: "acc-5", categoryId: "funds" }),
      ],
      "INVESTMENT",
      cats,
      ctx
    );
    expect(gainsByCategory(rows, "2026-02")).toEqual({ funds: 250, bonds: 100 });
    expect(unfiledGain(rows, "2026-02")).toBe(100);
    expect(gainsByCategory(rows, "2026-03")).toEqual({ funds: 300 });
    expect(unfiledGain(rows, "2026-03")).toBe(0);
  });

  it("adds up to the month's whole gain, filed and unfiled together", () => {
    const rows = valuationGainRows(
      [
        check(1100, 1000, FEB, { categoryId: "funds" }),
        check(900, 800, FEB, { accountId: "acc-4" }),
      ],
      "INVESTMENT",
      cats,
      ctx
    );
    const filed = Object.values(gainsByCategory(rows, "2026-02")).reduce((s, g) => s + g, 0);
    expect(filed + unfiledGain(rows, "2026-02")).toBe(
      monthGains(
        [
          check(1100, 1000, FEB, { categoryId: "funds" }),
          check(900, 800, FEB, { accountId: "acc-4" }),
        ],
        "INVESTMENT",
        cats,
        ctx,
        WINDOWS
      )["2026-02"]
    );
  });

  it("dresses filed gains as ledger rows, and never the unfiled ones", () => {
    const rows = valuationGainRows(
      [
        check(1100, 1000, FEB, { id: "v1", categoryId: "etfs" }),
        check(900, 800, FEB, { id: "v2", accountId: "acc-4" }),
      ],
      "INVESTMENT",
      cats,
      ctx
    );
    const ledger = gainRowsAsTransactions(rows, ctx);
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({ categoryId: "funds", amount: 100, currency: "USD" });
    // Marked synthetic so it never counts as a transaction of the month.
    expect(isSyntheticRow(ledger[0])).toBe(true);
    expect(ledger[0].occurredAt.toDate()).toEqual(FEB);
  });
});
