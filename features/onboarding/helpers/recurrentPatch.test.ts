import { oneTimePatch, recurrentPatch } from "./recurrentPatch";
import type { RecurrentRow } from "../hooks/useRecurrentStep";
import type { RecurrentTransaction } from "../../../types";

const item = (extra: Partial<RecurrentTransaction> = {}) =>
  ({
    id: "rt1",
    userId: "u1",
    domain: "EXPENSE",
    categoryId: "housing",
    name: "Rent",
    amount: 2_500_000,
    currency: "COP",
    frequency: "MONTHLY",
    type: "OTHER",
    // Backfilled: six months before the step ran.
    startDate: { toDate: () => new Date(2026, 3, 5, 12) },
    ...extra,
  }) as unknown as RecurrentTransaction;

const row = (extra: Partial<RecurrentRow> = {}): RecurrentRow => ({
  key: "k1",
  id: "rt1",
  categoryId: "housing",
  name: "Rent",
  amount: "2500000",
  currency: "COP",
  frequency: "MONTHLY",
  paymentMethodId: "",
  dayOfMonth: 5,
  secondDayOfMonth: 15,
  month: 3,
  date: "2026-04-05",
  ...extra,
});

const opts = { amount: 2_500_000, type: "OTHER" as const, backfill: true };

describe("recurrentPatch", () => {
  it("is null for an untouched row, so its startDate (and history) stays", () => {
    expect(recurrentPatch(row(), item(), opts)).toBeNull();
  });

  it("sends each changed field on its own", () => {
    expect(recurrentPatch(row({ name: " Apartment " }), item(), opts)).toEqual({
      name: "Apartment",
    });
    expect(recurrentPatch(row(), item(), { ...opts, amount: 2_600_000 })).toEqual({
      amount: 2_600_000,
    });
    expect(recurrentPatch(row({ currency: "USD" }), item(), opts)).toEqual({ currency: "USD" });
  });

  it("re-types the item when its category moves", () => {
    expect(
      recurrentPatch(row({ categoryId: "subs" }), item(), { ...opts, type: "SUBSCRIPTION" })
    ).toEqual({ categoryId: "subs", type: "SUBSCRIPTION" });
  });

  it("clears a payment method with null", () => {
    expect(recurrentPatch(row(), item({ paymentMethodId: "pm1" }), opts)).toEqual({
      paymentMethodId: null,
    });
    expect(recurrentPatch(row({ paymentMethodId: "pm2" }), item(), opts)).toEqual({
      paymentMethodId: "pm2",
    });
  });

  it("re-anchors the startDate only when the schedule changed", () => {
    const patch = recurrentPatch(row({ dayOfMonth: 20 }), item(), opts);
    expect(Object.keys(patch ?? {})).toEqual(["startDate"]);
    expect(new Date(patch!.startDate!).getDate()).toBe(20);
  });

  it("moves between the other cadences, carrying the second day only for twice a month", () => {
    const quarterly = item({ frequency: "QUARTERLY" });
    const toBiweekly = recurrentPatch(
      row({ frequency: "BIWEEKLY", secondDayOfMonth: 20 }),
      quarterly,
      opts
    );
    expect(toBiweekly).toMatchObject({ frequency: "BIWEEKLY", secondDayOfMonth: 20 });

    const biweekly = item({ frequency: "BIWEEKLY", secondDayOfMonth: 20 });
    expect(recurrentPatch(row({ frequency: "WEEKLY" }), biweekly, opts)).toMatchObject({
      frequency: "WEEKLY",
      secondDayOfMonth: null,
    });
  });
});

describe("oneTimePatch", () => {
  const before = row({ id: "tx1", frequency: "ONE_TIME", date: "2026-03-10" });
  const amounts = { amount: 2_500_000, beforeAmount: 2_500_000 };

  it("is null when nothing changed", () => {
    expect(oneTimePatch(before, before, amounts)).toBeNull();
  });

  it("moves the date as occurredAt", () => {
    const patch = oneTimePatch({ ...before, date: "2026-03-12" }, before, amounts);
    expect(Object.keys(patch ?? {})).toEqual(["occurredAt"]);
    expect(new Date(patch!.occurredAt!).getDate()).toBe(12);
  });

  it("sends a new amount and a cleared method", () => {
    expect(
      oneTimePatch(
        { ...before, paymentMethodId: "" },
        { ...before, paymentMethodId: "pm1" },
        {
          amount: 90,
          beforeAmount: 80,
        }
      )
    ).toEqual({ amount: 90, paymentMethodId: null });
  });
});
