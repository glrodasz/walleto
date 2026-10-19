import {
  isSpreadItem,
  isSyntheticRow,
  spreadItemIds,
  spreadLookback,
  spreadTransactions,
} from "./spread";
import { monthTotals, monthWindows } from "./months";
import { withoutHidden } from "../../../helpers/hidden";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type { Currency, RecurrentTransaction, Timestamp, Transaction } from "../../../types";

const ts = (date: Date): Timestamp => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
});
const now = new Date(2026, 8, 10, 12);
const windows = monthWindows(7, now); // Mar … Sep 2026
const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };

const insurance: RecurrentTransaction = {
  id: "ins",
  userId: "u1",
  domain: "EXPENSE",
  categoryId: "home",
  name: "Insurance",
  amount: 1200,
  currency: "USD",
  frequency: "YEARLY",
  startDate: ts(new Date(2026, 0, 15, 12)),
  active: true,
  spreadMonthly: true,
};
const tx = (
  id: string,
  amount: number,
  date: Date,
  extra: Partial<Transaction> = {}
): Transaction => ({
  id,
  userId: "u1",
  domain: "EXPENSE",
  categoryId: "home",
  name: id,
  amount,
  currency: "USD",
  occurredAt: ts(date),
  status: "PAID",
  ...extra,
});

describe("isSpreadItem", () => {
  it("is only true for active, flagged, non-monthly, non-one-time items", () => {
    expect(isSpreadItem(insurance)).toBe(true);
    expect(isSpreadItem({ ...insurance, frequency: "MONTHLY" })).toBe(false);
    expect(isSpreadItem({ ...insurance, frequency: "ONE_TIME" })).toBe(false);
    expect(isSpreadItem({ ...insurance, active: false })).toBe(false);
    expect(isSpreadItem({ ...insurance, spreadMonthly: false })).toBe(false);
    expect(spreadItemIds([insurance, { ...insurance, id: "m", frequency: "MONTHLY" }])).toEqual(
      new Set(["ins"])
    );
  });
});

describe("spreadTransactions", () => {
  const rows = [
    tx("paid", 1200, new Date(2026, 0, 15, 12), { recurrentTransactionId: "ins" }),
    tx("coffee", 4, new Date(2026, 8, 3, 12)),
  ];

  it("replaces the item's real rows with one slice per live window", () => {
    const out = spreadTransactions([insurance], rows, windows);
    const slices = out.filter(isSyntheticRow);
    expect(slices).toHaveLength(7);
    expect(slices.map((s) => s.amount)).toEqual(Array(7).fill(100));
    expect(slices[0]).toEqual(
      expect.objectContaining({
        id: "ins_spread_2026-03",
        recurrentTransactionId: "ins",
        categoryId: "home",
        currency: "USD",
        status: "PAID",
      })
    );
    expect(slices[0].occurredAt.toDate()).toEqual(windows[0].start);
    expect(out.find((t) => t.id === "paid")).toBeUndefined();
    expect(out.find((t) => t.id === "coffee")).toBeDefined();
    expect(monthTotals(out, ctx, windows)[windows[6].key]).toBe(104);
  });

  it("starts slicing at the item's start and stops at its end", () => {
    const later = {
      ...insurance,
      startDate: ts(new Date(2026, 6, 1)),
      endDate: ts(new Date(2026, 7, 15)),
    };
    const slices = spreadTransactions([later], [], windows).filter(isSyntheticRow);
    expect(slices.map((s) => s.id)).toEqual(["ins_spread_2026-07", "ins_spread_2026-08"]);
  });

  it("scales a charged pair and leaves the list alone without spread items", () => {
    const charged = { ...insurance, chargedAmount: 12000, chargedCurrency: "SEK" as const };
    const slice = spreadTransactions([charged], [], windows).filter(isSyntheticRow)[0];
    expect(slice.chargedAmount).toBeCloseTo(1000, 6);
    expect(slice.chargedCurrency).toBe("SEK");
    expect(spreadTransactions([{ ...insurance, spreadMonthly: false }], rows, windows)).toBe(rows);
  });

  it("keeps rows paid before the item's start, under an earlier schedule", () => {
    // Was monthly at 39, turned yearly on Sep 27 (the slices start in Sep).
    const bear = {
      ...insurance,
      id: "bear",
      amount: 399,
      startDate: ts(new Date(2026, 8, 27, 12)),
    };
    const history = [
      tx("bear_2026-08-09", 39, new Date(2026, 7, 9, 12), { recurrentTransactionId: "bear" }),
      tx("bear_2026-09-27", 399, new Date(2026, 8, 27, 12), { recurrentTransactionId: "bear" }),
    ];
    const out = spreadTransactions([bear], history, windows);
    expect(out.filter((t) => !isSyntheticRow(t)).map((t) => t.id)).toEqual(["bear_2026-08-09"]);
    expect(out.filter(isSyntheticRow).map((t) => t.id)).toEqual(["bear_spread_2026-09"]);
  });

  it("spreads the cycle's real payment, so a price raise waits for the next cycle", () => {
    // Paid 1,200 in January; the price went up to 1,320 afterwards.
    const raised = { ...insurance, amount: 1320 };
    const quarterly = {
      ...insurance,
      id: "q",
      amount: 330,
      frequency: "QUARTERLY" as const,
    };
    const history = [
      tx("ins_2026-01-15", 1200, new Date(2026, 0, 15, 12), { recurrentTransactionId: "ins" }),
      // Quarterly, paid at 300 through July; October is not paid yet.
      tx("q_2026-04-15", 300, new Date(2026, 3, 15, 12), { recurrentTransactionId: "q" }),
      tx("q-moved", 300, new Date(2026, 6, 20, 12), { recurrentTransactionId: "q" }),
    ];
    const slices = spreadTransactions([raised, quarterly], history, windows).filter(isSyntheticRow);
    const by = (id: string) =>
      slices.filter((s) => s.recurrentTransactionId === id).map((s) => s.amount);
    expect(by("ins")).toEqual(Array(7).fill(100));
    // Mar is January's cycle (not in the ledger): the current price.
    expect(by("q")).toEqual([110, 100, 100, 100, 100, 100, 100]);

    const nextYear = monthWindows(3, new Date(2027, 1, 10, 12)); // Dec 2026 … Feb 2027
    const ahead = spreadTransactions([raised], history, nextYear).filter(isSyntheticRow);
    expect(ahead.map((s) => s.amount)).toEqual([100, 110, 110]);
    expect(ahead.map((s) => s.cycle)).toEqual([
      {
        start: new Date(2026, 0, 15, 12),
        end: new Date(2027, 0, 14),
        amount: 1200,
        currency: "USD",
        paid: true,
      },
      {
        start: new Date(2027, 0, 15, 12),
        end: new Date(2028, 0, 14),
        amount: 1320,
        currency: "USD",
        paid: false,
      },
      expect.objectContaining({ start: new Date(2027, 0, 15, 12), paid: false }),
    ]);
  });

  it("composes with hiding through the item id", () => {
    const out = spreadTransactions([insurance], rows, windows);
    expect(withoutHidden(out, new Set(["ins"])).map((t) => t.id)).toEqual(["coffee"]);
  });
});

describe("spreadLookback", () => {
  it("reaches back to the payment that covers the first month", () => {
    const from = windows[0].start; // Mar 1
    expect(spreadLookback([insurance], from)).toEqual(new Date(2026, 0, 15));
    expect(spreadLookback([{ ...insurance, spreadMonthly: false }], from)).toBe(from);
    expect(spreadLookback([{ ...insurance, startDate: ts(new Date(2026, 5, 1)) }], from)).toBe(
      from
    );
  });
});
