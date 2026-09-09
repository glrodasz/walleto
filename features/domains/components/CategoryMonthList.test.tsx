import { fireEvent, render, screen } from "@testing-library/react";
import { CategoryMonthList, categoryMonthRows } from "./CategoryMonthList";
import { monthWindows } from "../helpers/months";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type {
  Category,
  Currency,
  RecurrentTransaction,
  Timestamp,
  Transaction,
} from "../../../types";

const now = new Date(2026, 8, 6, 15);
const sep = monthWindows(1, now)[0];
const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };

const ts = (date: Date): Timestamp => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
});

const categories = [
  { id: "home", userId: "u", domain: "EXPENSE", name: "Household" },
  { id: "rent", userId: "u", domain: "EXPENSE", name: "Rent", parentId: "home" },
  { id: "food", userId: "u", domain: "EXPENSE", name: "Food" },
  { id: "empty", userId: "u", domain: "EXPENSE", name: "Travel" },
] as Category[];

const tx = (id: string, categoryId: string, amount: number): Transaction => ({
  id,
  userId: "u",
  domain: "EXPENSE",
  categoryId,
  name: id,
  amount,
  currency: "USD",
  occurredAt: ts(new Date(2026, 8, 3, 12)),
  status: "PAID",
});

const rentItem: RecurrentTransaction = {
  id: "rentItem",
  userId: "u",
  domain: "EXPENSE",
  categoryId: "rent",
  name: "Rent",
  amount: 15_000,
  currency: "USD",
  frequency: "MONTHLY",
  startDate: ts(new Date(2026, 2, 25, 12)),
  active: true,
};

const transactions = [tx("a", "rent", 2_500), tx("b", "home", 300), tx("c", "food", 1_200)];

describe("categoryMonthRows", () => {
  it("rolls subcategories into their root, shares the month, and adds what is still planned", () => {
    const rows = categoryMonthRows(categories, transactions, [rentItem], ctx, sep, now);
    expect(
      rows.map((r) => [r.category.name, r.total, r.count, Math.round(r.share), r.planned])
    ).toEqual([
      ["Household", 2_800, 2, 70, 15_000],
      ["Food", 1_200, 1, 30, 0],
    ]);
  });

  it("skips planned amounts for a finished month", () => {
    const aug = monthWindows(2, now)[0];
    const rows = categoryMonthRows(categories, transactions, [rentItem], ctx, aug, now);
    expect(rows[0].planned).toBe(0);
  });
});

describe("CategoryMonthList", () => {
  it("renders rows with totals and opens a category on tap", () => {
    const onSelect = jest.fn();
    render(
      <CategoryMonthList
        domain="EXPENSE"
        categories={categories}
        transactions={transactions}
        items={[rentItem]}
        ctx={ctx}
        currency="USD"
        window={sep}
        now={now}
        onSelect={onSelect}
      />
    );
    const household = screen.getByRole("button", { name: /Household/ });
    expect(household).toHaveTextContent("2 transactions · 70% · $15,000.00 planned");
    expect(household).toHaveTextContent("$2,800.00");
    expect(screen.queryByText("Travel")).toBeNull();

    fireEvent.click(household);
    expect(onSelect).toHaveBeenCalledWith("home");
  });
});

describe("CategoryMonthList — hidden categories", () => {
  it("tags a hidden category and flips it through the kebab", () => {
    const onToggleHidden = jest.fn();
    const hiddenFood = categories.map((c) =>
      c.id === "food" ? { ...c, hiddenFromChart: true } : c
    );
    render(
      <CategoryMonthList
        domain="EXPENSE"
        categories={hiddenFood}
        transactions={[tx("t1", "food", 20)]}
        items={[]}
        ctx={ctx}
        currency="USD"
        window={sep}
        now={now}
        onSelect={jest.fn()}
        onToggleHidden={onToggleHidden}
      />
    );
    expect(screen.getByText("Hidden on chart")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Actions for Food" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Show on chart" }));
    expect(onToggleHidden).toHaveBeenCalledWith(expect.objectContaining({ id: "food" }));
  });
});
