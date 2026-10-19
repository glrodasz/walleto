import {
  bandError,
  cycleEnd,
  isPendingConfirmation,
  isVariable,
  pendingConfirmations,
  scenarioAmount,
} from "./variable";

const ts = (d: Date) => ({ seconds: d.getTime() / 1000, nanoseconds: 0, toDate: () => d });
const groceries = { amount: 600, amountFloor: 400 };

describe("scenarioAmount", () => {
  it("picks the floor, the midpoint or the top of a band", () => {
    expect(scenarioAmount(groceries, "floor")).toBe(400);
    expect(scenarioAmount(groceries, "average")).toBe(500);
    expect(scenarioAmount(groceries, "top")).toBe(600);
  });

  it("defaults to the worst case", () => {
    expect(scenarioAmount(groceries)).toBe(600);
  });

  it("leaves a fixed amount alone whatever the scenario", () => {
    expect(scenarioAmount({ amount: 15 }, "floor")).toBe(15);
    expect(isVariable({ amount: 15 })).toBe(false);
    expect(isVariable(groceries)).toBe(true);
  });
});

describe("bandError", () => {
  it("accepts a fixed amount and a band in an expense", () => {
    expect(bandError({ domain: "INCOME", amount: 10 })).toBeNull();
    expect(bandError({ domain: "EXPENSE", ...groceries })).toBeNull();
  });

  it("rejects a band outside expenses, upside down or with a charged pair", () => {
    expect(bandError({ domain: "INCOME", ...groceries })).toMatch(/expenses/);
    expect(bandError({ domain: "EXPENSE", amount: 400, amountFloor: 400 })).toMatch(/below/);
    expect(bandError({ domain: "EXPENSE", ...groceries, chargedAmount: 7 })).toMatch(/charged/);
  });
});

describe("cycleEnd", () => {
  const monthlyOn1st = { frequency: "MONTHLY" as const, startDate: ts(new Date(2026, 0, 1)) };

  it("is the next occurrence's day for a recurring item", () => {
    expect(cycleEnd(new Date(2026, 9, 1), monthlyOn1st)).toEqual(new Date(2026, 10, 1));
    const yearly = { frequency: "YEARLY" as const, startDate: ts(new Date(2025, 2, 15)) };
    expect(cycleEnd(new Date(2026, 2, 15), yearly)).toEqual(new Date(2027, 2, 15));
  });

  it("is the end of the calendar month for a one-off", () => {
    expect(cycleEnd(new Date(2026, 9, 12, 18))).toEqual(new Date(2026, 10, 1));
  });
});

describe("isPendingConfirmation", () => {
  const item = { frequency: "MONTHLY" as const, startDate: ts(new Date(2026, 0, 1)) };
  const row = { ...groceries, occurredAt: new Date(2026, 9, 1), status: "PAID" };

  it("asks once the cycle is over, not before", () => {
    expect(isPendingConfirmation(row, item, true, new Date(2026, 9, 31, 23))).toBe(false);
    expect(isPendingConfirmation(row, item, true, new Date(2026, 10, 1))).toBe(true);
  });

  it("never asks for a fixed, kept-variable or skipped row, or with confirmations off", () => {
    const later = new Date(2027, 0, 1);
    expect(isPendingConfirmation({ ...row, amountFloor: undefined }, item, true, later)).toBe(
      false
    );
    expect(isPendingConfirmation({ ...row, keepVariable: true }, item, true, later)).toBe(false);
    expect(isPendingConfirmation({ ...row, status: "SKIPPED" }, item, true, later)).toBe(false);
    expect(isPendingConfirmation(row, item, false, later)).toBe(false);
  });
});

describe("pendingConfirmations", () => {
  const item = { id: "g", frequency: "MONTHLY" as const, startDate: ts(new Date(2026, 0, 5)) };
  const row = (id: string, month: number, extra = {}) => ({
    id,
    recurrentTransactionId: "g",
    occurredAt: ts(new Date(2026, month, 5)),
    status: "PAID",
    ...groceries,
    ...extra,
  });
  const now = new Date(2026, 9, 17);

  it("lists the variable rows whose cycle is over, newest first", () => {
    const rows = [row("sep", 8), row("aug", 7), row("oct", 9)];
    expect(pendingConfirmations(rows, [item], true, now).map((r) => r.id)).toEqual(["sep", "aug"]);
  });

  it("skips confirmed, kept and skipped rows, and everything when turned off", () => {
    const rows = [
      row("confirmed", 7, { amountFloor: undefined }),
      row("kept", 7, { keepVariable: true }),
      row("skipped", 7, { status: "SKIPPED" }),
    ];
    expect(pendingConfirmations(rows, [item], true, now)).toEqual([]);
    expect(pendingConfirmations([row("aug", 7)], [item], false, now)).toEqual([]);
  });
});
