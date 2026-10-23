import { averageFrom, variableAverage } from "./variableAverage";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type { Timestamp, Transaction } from "../../../types";

const ts = (date: Date): Timestamp => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
});

const groceries = { id: "groceries", amount: 600, amountFloor: 400, currency: "USD" as const };
const october = new Date(2026, 9, 1);

const row = (month: number, amount: number, overrides: Partial<Transaction> = {}): Transaction => ({
  id: `g-${month}`,
  userId: "u1",
  domain: "EXPENSE",
  categoryId: "c1",
  recurrentTransactionId: "groceries",
  name: "Groceries",
  amount,
  currency: "USD",
  occurredAt: ts(new Date(2026, month, 5, 12)),
  status: "PAID",
  ...overrides,
});

describe("averageFrom", () => {
  it("starts six calendar months before the month on screen", () => {
    expect(averageFrom(october)).toEqual(new Date(2026, 3, 1));
    expect(averageFrom(new Date(2026, 1, 1))).toEqual(new Date(2025, 7, 1));
  });
});

describe("variableAverage", () => {
  it("averages the confirmed amounts of the six months before the one on screen", () => {
    const rows = [3, 4, 5, 6, 7, 8].map((m, i) => row(m, 400 + i * 40));
    expect(variableAverage(groceries, rows, october, IDENTITY_RATES)).toEqual({
      amount: 500,
      months: 6,
    });
  });

  it("leaves out the month on screen and anything older than six months", () => {
    const rows = [row(2, 9_000), row(8, 500), row(9, 9_000)];
    expect(variableAverage(groceries, rows, october, IDENTITY_RATES)).toEqual({
      amount: 500,
      months: 1,
    });
  });

  it("ignores estimates that still carry the band, and other items' rows", () => {
    const rows = [
      row(7, 450),
      row(8, 600, { amountFloor: 400 }),
      row(6, 9_000, { recurrentTransactionId: "rent" }),
    ];
    expect(variableAverage(groceries, rows, october, IDENTITY_RATES)).toEqual({
      amount: 450,
      months: 1,
    });
  });

  it("converts rows paid in another currency into the item's", () => {
    const rates = { ...IDENTITY_RATES, rates: { ...IDENTITY_RATES.rates, EUR: 0.5 } };
    const rows = [row(7, 400), row(8, 300, { currency: "EUR" })];
    expect(variableAverage(groceries, rows, october, rates)?.amount).toBe(500);
  });

  it("is null for a fixed item or when nothing was confirmed", () => {
    expect(
      variableAverage({ id: "rent", currency: "USD" }, [row(8, 1500)], october, IDENTITY_RATES)
    ).toBeNull();
    expect(
      variableAverage(groceries, [row(8, 500, { amountFloor: 400 })], october, IDENTITY_RATES)
    ).toBeNull();
  });
});
