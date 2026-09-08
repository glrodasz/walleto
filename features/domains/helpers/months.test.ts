import {
  expectedForMonth,
  groupByDay,
  monthKey,
  monthOccurrences,
  monthTotals,
  monthWindows,
  plannedOccurrences,
  plannedRemaining,
  trailingAverage,
} from "./months";
import { IDENTITY_RATES } from "../../../helpers/fx";
import { occurrenceId } from "../../../helpers/materializeOccurrences";
import type { Currency, RecurrentTransaction, Timestamp, Transaction } from "../../../types";

const now = new Date(2026, 8, 6, 15); // Sep 6 2026, 3pm
const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };

const ts = (date: Date): Timestamp => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
});

const item = (
  id: string,
  amount: number,
  startDate: Date,
  overrides: Partial<RecurrentTransaction> = {}
): RecurrentTransaction => ({
  id,
  userId: "u1",
  domain: "EXPENSE",
  categoryId: "c1",
  name: id,
  amount,
  currency: "USD",
  frequency: "MONTHLY",
  startDate: ts(startDate),
  active: true,
  ...overrides,
});

const tx = (
  id: string,
  amount: number,
  date: Date,
  extra: Partial<Transaction> = {}
): Transaction => ({
  id,
  userId: "u1",
  domain: "EXPENSE",
  categoryId: "c1",
  name: id,
  amount,
  currency: "USD",
  occurredAt: ts(date),
  status: "PAID",
  ...extra,
});

describe("monthWindows", () => {
  it("returns the last seven months oldest first, ending with the current one", () => {
    const windows = monthWindows(7, now);
    expect(windows.map((w) => w.label)).toEqual(["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]);
    expect(windows[0].key).toBe("2026-03");
    expect(windows[6]).toMatchObject({
      key: "2026-09",
      isCurrent: true,
      longLabel: "September 2026",
    });
    expect(windows[6].start).toEqual(new Date(2026, 8, 1));
    expect(windows[6].end).toEqual(new Date(2026, 9, 1));
    expect(windows.filter((w) => w.isCurrent)).toHaveLength(1);
  });

  it("does not overflow at the end of a long month", () => {
    const windows = monthWindows(3, new Date(2026, 4, 31)); // May 31
    expect(windows.map((w) => w.key)).toEqual(["2026-03", "2026-04", "2026-05"]);
  });

  it("crosses the year boundary", () => {
    expect(monthWindows(2, new Date(2026, 0, 15)).map((w) => w.key)).toEqual([
      "2025-12",
      "2026-01",
    ]);
    expect(monthKey(new Date(2025, 11, 3))).toBe("2025-12");
  });
});

describe("monthTotals", () => {
  it("sums converted amounts per month and ignores rows outside the windows", () => {
    const windows = monthWindows(3, now);
    const totals = monthTotals(
      [
        tx("a", 100, new Date(2026, 7, 23)),
        tx("b", 50, new Date(2026, 7, 30)),
        tx("c", 7, new Date(2026, 8, 2)),
        tx("old", 999, new Date(2026, 1, 1)),
      ],
      ctx,
      windows
    );
    expect(totals).toEqual({ "2026-07": 0, "2026-08": 150, "2026-09": 7 });
  });
});

describe("plannedOccurrences / plannedRemaining / expectedForMonth", () => {
  const rent = item("rent", 15_000, new Date(2026, 2, 25, 12)); // 25th monthly since March
  const netflix = item("netflix", 150, new Date(2026, 2, 23, 12));
  const oneOff = item("laptop", 2_000, new Date(2026, 8, 20, 12), { frequency: "ONE_TIME" });
  const stopped = item("gym", 500, new Date(2026, 2, 10, 12), { active: false });

  it("lists what is still to come this month, sorted, including one-time items", () => {
    const endOfMonth = new Date(2026, 9, 1, 0, 0, 0, -1);
    const planned = plannedOccurrences([rent, netflix, oneOff, stopped], ctx, now, endOfMonth);
    expect(planned.map((p) => p.item.id)).toEqual(["laptop", "netflix", "rent"]);
    expect(plannedRemaining([rent, netflix, oneOff, stopped], ctx, now, endOfMonth)).toBe(17_150);
  });

  it("expected = realized + still planned for the current month, realized alone for past months", () => {
    const [aug, sep] = monthWindows(2, now);
    expect(expectedForMonth(sep, 3_237, [rent, netflix], ctx, now)).toBe(3_237 + 15_150);
    expect(expectedForMonth(aug, 24_000, [rent, netflix], ctx, now)).toBe(24_000);
  });
});

describe("trailingAverage", () => {
  it("averages the finished months only", () => {
    const windows = monthWindows(4, now);
    const totals = { "2026-06": 10, "2026-07": 20, "2026-08": 30, "2026-09": 1 };
    expect(trailingAverage(totals, windows)).toBe(20);
    expect(trailingAverage({}, monthWindows(1, now))).toBeNull();
  });
});

describe("monthOccurrences", () => {
  const rent = item("rent", 15_000, new Date(2026, 2, 25, 12));
  const salary = item("salary", 57_650, new Date(2026, 2, 3, 12));
  const yearly = item("insurance", 1_200, new Date(2026, 0, 15, 12), { frequency: "YEARLY" });
  const sep = monthWindows(1, now)[0];

  it("marks paid by deterministic id, overdue when past without a payment, due when ahead", () => {
    const paidSalary = new Date(2026, 8, 3, 12);
    const paid = tx(occurrenceId("salary", paidSalary), 57_650, paidSalary, {
      recurrentTransactionId: "salary",
    });
    const { occurrences, notThisMonth } = monthOccurrences(
      [rent, salary, yearly],
      [paid],
      ctx,
      sep,
      now
    );
    expect(occurrences.map((o) => [o.item.id, o.status])).toEqual([
      ["salary", "paid"],
      ["rent", "due"],
    ]);
    expect(notThisMonth.map((i) => i.id)).toEqual(["insurance"]);
  });

  it("treats a same-day payment for the item as paid even under a different id", () => {
    const paid = tx("random", 57_650, new Date(2026, 8, 3, 9), {
      recurrentTransactionId: "salary",
    });
    const { occurrences } = monthOccurrences([salary], [paid], ctx, sep, now);
    expect(occurrences[0].status).toBe("paid");
  });

  it("flags an unpaid past occurrence as overdue", () => {
    const { occurrences } = monthOccurrences([salary], [], ctx, sep, now);
    expect(occurrences[0]).toMatchObject({ status: "overdue", amount: 57_650 });
  });
});

describe("groupByDay", () => {
  it("groups newest day first with a converted daily subtotal", () => {
    const groups = groupByDay(
      [
        tx("a", 90, new Date(2026, 8, 5, 9)),
        tx("b", 7_403, new Date(2026, 8, 6, 8)),
        tx("c", 117, new Date(2026, 8, 5, 18)),
      ],
      ctx,
      now
    );
    expect(groups.map((g) => [g.label, g.total, g.rows.length])).toEqual([
      ["Today", 7_403, 1],
      ["Yesterday", 207, 2],
    ]);
    expect(groups[1].rows.map((r) => r.id)).toEqual(["c", "a"]);
  });
});
