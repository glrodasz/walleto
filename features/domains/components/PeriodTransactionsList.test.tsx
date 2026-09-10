import { fireEvent, render, screen, within } from "@testing-library/react";
import { PeriodTransactionsList } from "./PeriodTransactionsList";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type { Currency, Timestamp, Transaction } from "../../../types";

const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };
const now = new Date(2026, 8, 6, 15);

const ts = (date: Date): Timestamp => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
});

const tx = (
  id: string,
  name: string,
  date: Date,
  extra: Partial<Transaction> = {}
): Transaction => ({
  id,
  userId: "u1",
  domain: "EXPENSE",
  categoryId: "c1",
  name,
  amount: 10,
  currency: "USD",
  occurredAt: ts(date),
  status: "PAID",
  ...extra,
});

const base = {
  title: "Payments",
  displayCurrency: "USD" as Currency,
  ctx,
  deletingId: null,
  now,
};

describe("PeriodTransactionsList", () => {
  it("groups by day, newest first, with a daily subtotal and a recurring tag", () => {
    render(
      <PeriodTransactionsList
        {...base}
        transactions={[
          tx("a", "Old coffee", new Date(2026, 8, 3, 9)),
          tx("b", "Netflix", new Date(2026, 8, 6, 8), { recurrentTransactionId: "r1" }),
          tx("c", "Bread", new Date(2026, 8, 6, 12), {
            amount: 5,
            chargedAmount: 20000,
            chargedCurrency: "COP",
          }),
        ]}
        onDelete={jest.fn()}
      />
    );
    const days = screen.getAllByRole("heading", { level: 3 });
    expect(days[0]).toHaveTextContent("Today");
    expect(days[0]).toHaveTextContent("$15.00");
    expect(days[1]).toHaveTextContent("3 days ago");

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Bread");
    expect(items[0]).toHaveTextContent("charged COP 20,000");
    expect(items[1]).toHaveTextContent("Netflix");
    expect(items[1]).not.toHaveTextContent("charged");
    expect(items[1]).toHaveTextContent("recurring");
    expect(items[2]).toHaveTextContent("Old coffee");
    expect(items[2]).toHaveTextContent("one-off");
  });

  it("deletes through the kebab and shows the empty state", () => {
    const onDelete = jest.fn();
    const { rerender } = render(
      <PeriodTransactionsList
        {...base}
        transactions={[tx("a", "Bread", new Date(2026, 8, 6))]}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Actions for Bread" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith("a");

    rerender(<PeriodTransactionsList {...base} transactions={[]} onDelete={onDelete} />);
    expect(screen.getByText("Nothing recorded in this period")).toBeInTheDocument();
  });

  it("caps the rows and says how many more there are", () => {
    const list = Array.from({ length: 23 }, (_, i) =>
      tx(`t${i}`, `Row ${i}`, new Date(2026, 8, 1 + (i % 6), 8 + i))
    );
    render(
      <PeriodTransactionsList {...base} transactions={list} onDelete={jest.fn()} limit={20} />
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(20);
    expect(screen.getByText("and 3 more in this period")).toBeInTheDocument();
    expect(
      within(screen.getAllByRole("heading", { level: 3 })[0]).getByText(/\$/)
    ).toBeInTheDocument();
  });
});
