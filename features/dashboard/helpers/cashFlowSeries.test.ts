import { IDENTITY_RATES } from "../../../helpers/fx";
import { monthWindows } from "../../domains/helpers/months";
import { cashFlowSeries, flatKey } from "./cashFlowSeries";
import type { Category, Domain, Transaction } from "../../../types";

const ctx = { rates: IDENTITY_RATES, target: "USD" as const };
const now = new Date(2026, 8, 11);
const windows = monthWindows(2, now); // Aug, Sep 2026

const tx = (domain: Domain, day: number, amount: number, categoryId: string, currency = "USD") =>
  ({
    domain,
    occurredAt: new Date(2026, 8, day),
    amount,
    currency,
    categoryId,
    status: "PAID",
    name: "x",
    userId: "u",
  }) as unknown as Transaction;

const cats = [
  { id: "salary", name: "Salary", domain: "INCOME" },
  { id: "home", name: "Home", domain: "EXPENSE" },
  { id: "food", name: "Food", domain: "EXPENSE" },
] as Category[];

const byDomain: Record<Domain, Transaction[]> = {
  INCOME: [tx("INCOME", 1, 1000, "salary")],
  EXPENSE: [tx("EXPENSE", 2, 300, "home"), tx("EXPENSE", 3, 100, "food", "EUR")],
  INVESTMENT: [],
  SAVING: [tx("SAVING", 4, 50, "pocket")],
};

describe("cashFlowSeries", () => {
  it("grouped by domain: one series per domain, empty domains still present", () => {
    const { data, groups } = cashFlowSeries(byDomain, cats, ctx, windows, { groupBy: "domain" });
    expect(groups.map((g) => g.key)).toEqual(["INCOME", "EXPENSE", "INVESTMENT", "SAVING"]);
    expect(groups.every((g) => g.series.length === 1)).toBe(true);
    const sep = data[1];
    expect(sep.key).toBe("2026-09");
    expect(sep[flatKey("INCOME", "total")]).toBe(1000);
    expect(sep[flatKey("EXPENSE", "total")]).toBe(400);
    expect(sep[flatKey("INVESTMENT", "total")]).toBe(0);
    expect(data[0][flatKey("SAVING", "total")]).toBe(0);
  });

  it("grouped by category: each domain stacks its own roots", () => {
    const { data, groups } = cashFlowSeries(byDomain, cats, ctx, windows, { groupBy: "category" });
    const expense = groups.find((g) => g.key === "EXPENSE")!;
    expect(expense.series.map((s) => s.label)).toEqual(["Home", "Food"]);
    expect(data[1][flatKey("EXPENSE", "home")]).toBe(300);
    expect(data[1][flatKey("EXPENSE", "food")]).toBe(100);
    const saving = groups.find((g) => g.key === "SAVING")!;
    expect(saving.series[0].label).toBe("Unknown");
  });

  it("grouped by currency: a currency keeps its palette colour everywhere", () => {
    const { groups } = cashFlowSeries(byDomain, cats, ctx, windows, { groupBy: "currency" });
    const expense = groups.find((g) => g.key === "EXPENSE")!;
    expect(expense.series.map((s) => s.key)).toEqual(["USD", "EUR"]);
    expect(expense.series[0].color).toBe("var(--palette-1)");
    expect(expense.series[1].color).toBe("var(--palette-2)");
  });
});
