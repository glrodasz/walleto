import { debtSummary } from "./debtSummary";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type { AccountValueRow } from "../../investments/helpers/domainValue";
import type { Currency, RecurrentTransaction, Timestamp, Transaction } from "../../../types";

const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };
const ts = (date: Date): Timestamp => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
});

const row = (accountId: string, value: number, over: Partial<AccountValueRow> = {}) =>
  ({
    key: `acc:${accountId}`,
    selector: { accountId },
    name: accountId,
    invested: 0,
    value,
    latest: null,
    gainPct: null,
    known: true,
    borrowed: 0,
    ...over,
  }) as AccountValueRow;

const item = (accountId: string, amount: number, over: Partial<RecurrentTransaction> = {}) =>
  ({
    id: `rt-${accountId}`,
    userId: "u1",
    domain: "DEBT",
    categoryId: `cat-${accountId}`,
    accountId,
    name: "Payment",
    amount,
    currency: "USD",
    frequency: "MONTHLY",
    startDate: ts(new Date(2026, 0, 1)),
    active: true,
    ...over,
  }) as RecurrentTransaction;

const tx = (accountId: string, categoryId: string, date: Date): Transaction => ({
  userId: "u1",
  domain: "DEBT",
  categoryId,
  accountId,
  name: "Row",
  amount: 100,
  currency: "USD",
  occurredAt: ts(date),
  status: "PAID",
});

describe("debtSummary", () => {
  it("puts each debt's balance next to its monthly payment, and keeps the two apart", () => {
    const summary = debtSummary(
      [row("mortgage", 180_000), row("ana", 1_100)],
      [item("mortgage", 900), item("mortgage", 300, { frequency: "QUARTERLY", id: "rt-fee" })],
      [],
      ctx
    );
    expect(summary.owed).toBe(181_100);
    expect(summary.monthly).toBe(1_000);
    expect(summary.rows.map((r) => [r.row.name, r.monthly])).toEqual([
      ["mortgage", 1_000],
      ["ana", 0],
    ]);
  });

  it("leaves unknown balances out of the total and sinks them, then paid-off debts", () => {
    const summary = debtSummary(
      [row("paid", 0), row("car", 0, { known: false }), row("ana", 500)],
      [item("old", 50, { active: false })],
      [],
      ctx
    );
    expect(summary.rows.map((r) => r.row.name)).toEqual(["ana", "car", "paid"]);
    expect(summary.rows.map((r) => r.paidOff)).toEqual([false, false, true]);
    expect(summary.owed).toBe(500);
    expect(summary.unknown).toBe(1);
  });

  it("files a quick payment under the plan's category, else the debt's latest row's", () => {
    const summary = debtSummary(
      [row("mortgage", 10), row("ana", 10)],
      [item("mortgage", 900)],
      [tx("ana", "cat-old", new Date(2026, 0, 1)), tx("ana", "cat-friends", new Date(2026, 2, 1))],
      ctx
    );
    const byName = Object.fromEntries(summary.rows.map((r) => [r.row.name, r.categoryId]));
    expect(byName).toEqual({ mortgage: "cat-mortgage", ana: "cat-friends" });
  });
});
