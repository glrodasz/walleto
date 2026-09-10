import { isSpreadItem, isSyntheticRow, spreadItemIds, spreadTransactions } from "./spread";
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

  it("composes with hiding through the item id", () => {
    const out = spreadTransactions([insurance], rows, windows);
    expect(withoutHidden(out, new Set(["ins"])).map((t) => t.id)).toEqual(["coffee"]);
  });
});
