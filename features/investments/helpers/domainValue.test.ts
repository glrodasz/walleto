import { domainValueRows, domainValueTotals } from "./domainValue";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type {
  Account,
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
const NOW = new Date(2026, 8, 20);

const account = (id: string, name: string, overrides: Partial<Account> = {}): Account => ({
  id,
  userId: "u1",
  domain: "INVESTMENT",
  name,
  currency: "USD",
  ...overrides,
});

const tx = (amount: number, accountId?: string): Transaction => ({
  userId: "u1",
  domain: "INVESTMENT",
  categoryId: "funds",
  accountId,
  name: "Contribution",
  amount,
  currency: "USD",
  occurredAt: ts(new Date(2026, 0, 10)),
  status: "PAID",
});

const check = (
  value: number,
  costBasis: number,
  date: Date,
  accountId?: string
): InvestmentValuation => ({
  userId: "u1",
  domain: "INVESTMENT",
  accountId,
  asOf: ts(date),
  gainPct: ((value - costBasis) / costBasis) * 100,
  value,
  costBasis,
  currency: "USD",
});

const accounts = [account("acc-1", "Avanza"), account("acc-2", "Coinbase")];

describe("domainValueRows", () => {
  it("builds one row per account, worth the latest check plus what went in since", () => {
    const rows = domainValueRows(
      accounts,
      [tx(1_000, "acc-1"), tx(500, "acc-2")],
      [check(1_200, 1_000, new Date(2026, 5, 1), "acc-1")],
      "INVESTMENT",
      "account",
      ctx,
      NOW
    );
    const avanza = rows.find((r) => r.key === "acc:acc-1")!;
    expect(avanza).toMatchObject({ name: "Avanza", invested: 1_000, value: 1_200, gainPct: 20 });
    // No check on Coinbase and no rate, so it is worth exactly what went in.
    expect(rows.find((r) => r.key === "acc:acc-2")).toMatchObject({ value: 500, gainPct: 0 });
  });

  it("sorts by what each position is worth, largest first", () => {
    const rows = domainValueRows(
      accounts,
      [tx(100, "acc-1"), tx(900, "acc-2")],
      [],
      "INVESTMENT",
      "account",
      ctx,
      NOW
    );
    expect(rows.map((r) => r.name)).toEqual(["Coinbase", "Avanza"]);
  });

  it("adds the bucket row only when something is filed under no account", () => {
    const withoutBucket = domainValueRows(
      accounts,
      [tx(100, "acc-1")],
      [],
      "INVESTMENT",
      "account",
      ctx,
      NOW
    );
    expect(withoutBucket.map((r) => r.key)).not.toContain("dom:INVESTMENT");

    const withBucket = domainValueRows(
      accounts,
      [tx(100, "acc-1"), tx(250)],
      [],
      "INVESTMENT",
      "account",
      ctx,
      NOW
    );
    expect(withBucket.find((r) => r.key === "dom:INVESTMENT")).toMatchObject({
      name: "No account",
      invested: 250,
    });
  });

  it("keeps a bucket that holds only a value check, with nothing paid in", () => {
    const rows = domainValueRows(
      [],
      [],
      [check(800, 700, new Date(2026, 5, 1))],
      "INVESTMENT",
      "account",
      ctx,
      NOW
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ key: "dom:INVESTMENT", invested: 0, value: 800 });
  });
});

describe("domainValueTotals", () => {
  it("sums the domain and reports the most recent check across every account", () => {
    const rows = domainValueRows(
      accounts,
      [tx(1_000, "acc-1"), tx(500, "acc-2")],
      [
        check(1_200, 1_000, new Date(2026, 5, 1), "acc-1"),
        check(600, 500, new Date(2026, 7, 4), "acc-2"),
      ],
      "INVESTMENT",
      "account",
      ctx,
      NOW
    );
    expect(domainValueTotals(rows)).toEqual({
      invested: 1_500,
      value: 1_800,
      lastCheckedAt: new Date(2026, 7, 4),
    });
  });

  it("reports no check date when nothing has ever been checked", () => {
    const rows = domainValueRows(
      accounts,
      [tx(100, "acc-1")],
      [],
      "INVESTMENT",
      "account",
      ctx,
      NOW
    );
    expect(domainValueTotals(rows).lastCheckedAt).toBeNull();
  });
});

describe("domainValueRows for debts", () => {
  const visa = account("visa", "Visa", {
    domain: "DEBT",
    interestRate: { value: 12, period: "YEARLY" },
  });
  const loan = account("loan", "Car loan", { domain: "DEBT" });
  const repay = (amount: number, accountId: string): Transaction => ({
    ...tx(amount, accountId),
    domain: "DEBT",
    categoryId: "cards",
    name: "Repayment",
  });

  it("shows what is owed and what was repaid, with no gain %", () => {
    const rows = domainValueRows(
      [visa, loan],
      [repay(300, "visa"), repay(200, "visa"), repay(100, "loan")],
      [{ ...check(5000, 0, new Date(2026, 0, 1), "visa"), domain: "DEBT", gainPct: 0 }],
      "DEBT",
      "debt",
      ctx,
      NOW
    );
    const card = rows.find((r) => r.key === "acc:visa")!;
    expect(card.invested).toBe(500);
    // 4,500 of principal left plus most of a year's interest on it.
    expect(card.value).toBeGreaterThan(4500);
    expect(card.gainPct).toBeNull();
    // No balance recorded: owed is unknown and never reads as a figure.
    expect(rows.find((r) => r.key === "acc:loan")).toMatchObject({
      invested: 100,
      value: 0,
      latest: null,
      gainPct: null,
    });
    expect(domainValueTotals(rows).invested).toBe(600);
  });

  it("names the bucket Unassigned rather than something that reads as debt-free", () => {
    const rows = domainValueRows(
      [],
      [repay(50, undefined as unknown as string)],
      [],
      "DEBT",
      "debt",
      ctx,
      NOW
    );
    expect(rows.find((r) => r.key === "dom:DEBT")).toMatchObject({
      name: "Unassigned",
      invested: 50,
    });
  });
});
