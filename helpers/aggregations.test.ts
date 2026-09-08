import {
  computeFlow,
  computeMoM,
  convertedAmount,
  groupByCategory,
  sumMonthly,
  toMonthlyAmount,
} from "./aggregations";
import type { MoneyContext } from "./aggregations";
import { IDENTITY_RATES } from "./fx";
import type { ExchangeRates } from "./fx";
import type { Currency, RecurrentTransaction, Transaction, Timestamp } from "../types";

const RATES: ExchangeRates = {
  base: "USD",
  rates: { USD: 1, EUR: 0.9, MXN: 17, GBP: 0.8, SEK: 10, CHF: 0.95, JPY: 150, COP: 4000 },
  fetchedAt: "2026-06-01T00:00:00.000Z",
};

const USD: MoneyContext = { rates: IDENTITY_RATES, target: "USD" };
const USD_REAL: MoneyContext = { rates: RATES, target: "USD" };

const makeItem = (
  frequency: RecurrentTransaction["frequency"],
  amount: number,
  categoryId = "cat1",
  currency: Currency = "USD",
  extra: Partial<RecurrentTransaction> = {}
): RecurrentTransaction => ({
  userId: "u1",
  domain: "EXPENSE",
  categoryId,
  name: "Test",
  amount,
  currency,
  frequency,
  active: true,
  startDate: { seconds: 0, nanoseconds: 0, toDate: () => new Date(0) } as Timestamp,
  ...extra,
});

const makeTransaction = (
  amount: number,
  date: Date,
  extra: Partial<Transaction> = {}
): Transaction => ({
  userId: "u1",
  domain: "EXPENSE",
  categoryId: "cat1",
  name: "T",
  amount,
  currency: "USD",
  occurredAt: {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => date,
  } as Timestamp,
  status: "PAID",
  ...extra,
});

describe("convertedAmount", () => {
  it("converts a foreign-currency amount into the target", () => {
    const item = makeItem("MONTHLY", 4000, "cat1", "COP");
    expect(convertedAmount(item, USD_REAL)).toBeCloseTo(1);
  });

  it("prefers the charged pair when chargedCurrency matches the target", () => {
    // Stated $1,400 USD but actually debited 5,800,000 COP.
    const item = makeItem("MONTHLY", 1400, "cat1", "USD", {
      chargedAmount: 5_800_000,
      chargedCurrency: "COP",
    });
    expect(convertedAmount(item, { rates: RATES, target: "COP" })).toBe(5_800_000);
  });

  it("ignores the charged pair when the target is a third currency", () => {
    const item = makeItem("MONTHLY", 1400, "cat1", "USD", {
      chargedAmount: 5_800_000,
      chargedCurrency: "COP",
    });
    // Target EUR: convert the stated USD price, not the COP debit.
    expect(convertedAmount(item, { rates: RATES, target: "EUR" })).toBeCloseTo(1260);
  });
});

describe("toMonthlyAmount", () => {
  it("ONE_TIME returns 0", () => {
    expect(toMonthlyAmount(makeItem("ONE_TIME", 100), USD)).toBe(0);
  });

  it("MONTHLY is 1x amount", () => {
    expect(toMonthlyAmount(makeItem("MONTHLY", 50), USD)).toBe(50);
  });

  it("YEARLY divides by 12", () => {
    expect(toMonthlyAmount(makeItem("YEARLY", 120), USD)).toBeCloseTo(10);
  });

  it("QUARTERLY divides by 3", () => {
    expect(toMonthlyAmount(makeItem("QUARTERLY", 90), USD)).toBeCloseTo(30);
  });

  it("WEEKLY multiplies by 4.345", () => {
    expect(toMonthlyAmount(makeItem("WEEKLY", 10), USD)).toBeCloseTo(43.45);
  });

  it("BIWEEKLY is twice a month", () => {
    expect(toMonthlyAmount(makeItem("BIWEEKLY", 10), USD)).toBe(20);
  });
});

describe("sumMonthly", () => {
  it("returns 0 for empty array", () => {
    expect(sumMonthly([], USD)).toBe(0);
  });

  it("sums all items' monthly equivalents", () => {
    const items = [makeItem("MONTHLY", 100), makeItem("YEARLY", 120)];
    expect(sumMonthly(items, USD)).toBeCloseTo(110);
  });

  it("converts mixed currencies into the target before summing", () => {
    // $200 USD + 200 EUR (≈ $222.22) + 400,000 COP (≈ $100)
    const items = [
      makeItem("MONTHLY", 200, "cat1", "USD"),
      makeItem("MONTHLY", 200, "cat1", "EUR"),
      makeItem("MONTHLY", 400_000, "cat1", "COP"),
    ];
    expect(sumMonthly(items, USD_REAL)).toBeCloseTo(200 + 200 / 0.9 + 100);
  });
});

describe("groupByCategory", () => {
  it("returns empty object for empty array", () => {
    expect(groupByCategory([], USD)).toEqual({});
  });

  it("groups and sums by categoryId", () => {
    const items = [
      makeItem("MONTHLY", 100, "catA"),
      makeItem("MONTHLY", 50, "catA"),
      makeItem("MONTHLY", 200, "catB"),
    ];
    const result = groupByCategory(items, USD);
    expect(result["catA"]).toBeCloseTo(150);
    expect(result["catB"]).toBeCloseTo(200);
  });
});

describe("computeFlow", () => {
  it("net is what remains unallocated after spending, saving and investing", () => {
    const flow = computeFlow(
      {
        INCOME: [makeItem("MONTHLY", 5000, "c", "USD", { domain: "INCOME" })],
        EXPENSE: [makeItem("MONTHLY", 2000)],
        SAVING: [makeItem("MONTHLY", 300, "c", "USD", { domain: "SAVING" })],
        INVESTMENT: [makeItem("MONTHLY", 700, "c", "USD", { domain: "INVESTMENT" })],
      },
      USD
    );
    expect(flow).toEqual({
      income: 5000,
      expenses: 2000,
      savings: 300,
      investments: 700,
      net: 2000,
    });
  });

  it("treats missing domains as zero", () => {
    const flow = computeFlow({ INCOME: [makeItem("MONTHLY", 1000)] }, USD);
    expect(flow.net).toBe(1000);
    expect(flow.expenses).toBe(0);
  });
});

describe("computeMoM", () => {
  const now = new Date(2026, 5, 20);

  it("returns zeros for empty array", () => {
    expect(computeMoM([], { ...USD, now })).toMatchObject({
      current: 0,
      previous: 0,
      deltaPct: 0,
    });
  });

  it("compares month-to-date against the same day range of last month", () => {
    const sep2 = new Date(2026, 8, 2, 15);
    const txns = [
      makeTransaction(625, new Date(2026, 8, 2, 9)), // this month
      makeTransaction(600, new Date(2026, 7, 1, 10)), // Aug 1 — inside the range
      makeTransaction(57_650, new Date(2026, 7, 23)), // Aug 23 — after the same point
    ];
    const { current, previous, deltaPct, previousThrough } = computeMoM(txns, {
      ...USD,
      now: sep2,
    });
    expect(current).toBe(625);
    expect(previous).toBe(600);
    expect(deltaPct).toBeCloseTo(4.17, 1);
    expect(previousThrough).toEqual(new Date(2026, 7, 2, 15));
  });

  it("clamps the previous range to the shorter month", () => {
    const mar31 = new Date(2026, 2, 31, 23, 59);
    const txns = [makeTransaction(50, new Date(2026, 1, 28, 12))];
    const { previous, previousThrough } = computeMoM(txns, { ...USD, now: mar31 });
    expect(previous).toBe(50);
    expect(previousThrough).toEqual(new Date(2026, 1, 28, 23, 59));
  });

  it("calculates delta correctly", () => {
    const txns = [
      makeTransaction(100, new Date(2026, 5, 15)),
      makeTransaction(80, new Date(2026, 4, 15)),
    ];
    const { current, previous, deltaPct } = computeMoM(txns, { ...USD, now });
    expect(current).toBe(100);
    expect(previous).toBe(80);
    expect(deltaPct).toBeCloseTo(25);
  });

  it("handles year rollover (December to January)", () => {
    const txns = [
      makeTransaction(200, new Date(2025, 0, 15)),
      makeTransaction(150, new Date(2024, 11, 15)),
    ];
    const { current, previous, deltaPct } = computeMoM(txns, {
      ...USD,
      now: new Date(2025, 0, 20),
    });
    expect(current).toBe(200);
    expect(previous).toBe(150);
    expect(deltaPct).toBeCloseTo(33.33, 1);
  });

  it("deltaPct is 0 when previous is 0", () => {
    const { deltaPct } = computeMoM([makeTransaction(100, new Date(2026, 5, 15))], {
      ...USD,
      now,
    });
    expect(deltaPct).toBe(0);
  });

  it("filters to one domain so income cannot pollute an expense delta", () => {
    const txns = [
      makeTransaction(100, new Date(2026, 5, 15)),
      makeTransaction(5000, new Date(2026, 5, 15), { domain: "INCOME" }),
    ];
    const { current } = computeMoM(txns, { ...USD, now, domain: "EXPENSE" });
    expect(current).toBe(100);
  });

  it("converts each transaction's own currency", () => {
    const txns = [
      makeTransaction(100, new Date(2026, 5, 15)),
      makeTransaction(400_000, new Date(2026, 5, 16), { currency: "COP" }),
    ];
    const { current } = computeMoM(txns, { rates: RATES, target: "USD", now });
    expect(current).toBeCloseTo(200);
  });
});
