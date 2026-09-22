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

  it("keeps a category whose rows cancelled out, and clamps shares at what came in", () => {
    const rows = categoryMonthRows(
      [
        { id: "funds", userId: "u", domain: "INVESTMENT", name: "Funds" },
        { id: "crypto", userId: "u", domain: "INVESTMENT", name: "Crypto" },
      ] as Category[],
      [
        { ...tx("in", "funds", 1_000), domain: "INVESTMENT" },
        { ...tx("buy", "crypto", 500), domain: "INVESTMENT" },
        { ...tx("sell", "crypto", 500), domain: "INVESTMENT", direction: "OUT" },
      ],
      [],
      ctx,
      sep,
      now
    );
    expect(rows.map((r) => [r.category.name, r.total, r.count, r.share])).toEqual([
      ["Funds", 1_000, 1, 100],
      ["Crypto", 0, 2, 0],
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
    expect(screen.getByText("Hidden")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Actions for Food" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Show on chart" }));
    expect(onToggleHidden).toHaveBeenCalledWith(expect.objectContaining({ id: "food" }));
  });
});

describe("categoryMonthRows — synthetic slices", () => {
  it("count toward the total but not the transaction count", () => {
    const slice = { ...tx("slice", "food", 100), synthetic: true } as Transaction;
    const rows = categoryMonthRows(categories, [tx("t1", "food", 20), slice], [], ctx, sep, now);
    const food = rows.find((r) => r.category.id === "food")!;
    expect(food.total).toBe(120);
    expect(food.count).toBe(1);
  });
});

describe("CategoryMonthList — gains from value checks", () => {
  it("folds a category's gain into its total and reshares the month", () => {
    const rows = categoryMonthRows(categories, transactions, [], ctx, sep, now, { food: 2_000 });
    expect(rows.map((r) => [r.category.name, r.total, r.gain, Math.round(r.share)])).toEqual([
      // Food's 1,200 in plus 2,000 gained now outweighs Household's 2,800.
      ["Food", 3_200, 2_000, 53],
      ["Household", 2_800, 0, 47],
    ]);
  });

  it("keeps a category whose whole month is a gain, with no transactions", () => {
    const rows = categoryMonthRows(categories, [], [], ctx, sep, now, { empty: 900 });
    expect(rows.map((r) => [r.category.name, r.total, r.count])).toEqual([["Travel", 900, 0]]);
  });

  it("keeps a category the market took more from than went in", () => {
    const rows = categoryMonthRows(categories, [tx("a", "food", 100)], [], ctx, sep, now, {
      food: -400,
    });
    expect(rows[0].total).toBe(-300);
  });

  it("names the gain in the row's meta, and the loss as a loss", () => {
    const { rerender } = render(
      <CategoryMonthList
        domain="INVESTMENT"
        categories={categories}
        transactions={[tx("a", "food", 1_200)]}
        items={[]}
        gains={{ food: 2_000 }}
        ctx={ctx}
        currency="USD"
        window={sep}
        now={now}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /Food/ })).toHaveTextContent(
      "1 transaction · 100% · $2,000.00 gain"
    );

    rerender(
      <CategoryMonthList
        domain="INVESTMENT"
        categories={categories}
        transactions={[tx("a", "food", 1_200)]}
        items={[]}
        gains={{ food: -300 }}
        ctx={ctx}
        currency="USD"
        window={sep}
        now={now}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /Food/ })).toHaveTextContent("$300.00 loss");
  });

  it("gives gains that name no category a row of their own", () => {
    render(
      <CategoryMonthList
        domain="INVESTMENT"
        categories={categories}
        transactions={[]}
        items={[]}
        unfiledGain={640}
        ctx={ctx}
        currency="USD"
        window={sep}
        now={now}
        onSelect={jest.fn()}
      />
    );
    expect(screen.queryByText("Nothing in this month yet")).toBeNull();
    expect(screen.getByText("From value checks that name no category")).toBeInTheDocument();
    expect(screen.getByText("$640.00")).toBeInTheDocument();
  });
});
