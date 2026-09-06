import { fireEvent, render, screen } from "@testing-library/react";
import { PeriodTransactionsList } from "./PeriodTransactionsList";
import type { Timestamp, Transaction } from "../../../types";

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

describe("PeriodTransactionsList", () => {
  it("lists newest first and tags rows that came from a recurring item", () => {
    const now = new Date();
    const older = new Date(now.getTime() - 3 * 86400000);
    render(
      <PeriodTransactionsList
        title="Payments"
        transactions={[
          tx("a", "Old coffee", older),
          tx("b", "Netflix", now, { recurrentTransactionId: "r1" }),
        ]}
        displayCurrency="USD"
        onDelete={jest.fn()}
        deletingId={null}
      />
    );
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Netflix");
    expect(items[0]).toHaveTextContent("recurring");
    expect(items[1]).toHaveTextContent("Old coffee");
    expect(items[1]).not.toHaveTextContent("recurring");
  });

  it("deletes through the kebab and shows the empty state", () => {
    const onDelete = jest.fn();
    const { rerender } = render(
      <PeriodTransactionsList
        title="Payments"
        transactions={[tx("a", "Bread", new Date())]}
        displayCurrency="USD"
        onDelete={onDelete}
        deletingId={null}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Actions for Bread" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith("a");

    rerender(
      <PeriodTransactionsList
        title="Payments"
        transactions={[]}
        displayCurrency="USD"
        onDelete={onDelete}
        deletingId={null}
      />
    );
    expect(screen.getByText("Nothing recorded in this period")).toBeInTheDocument();
  });

  it("caps the list and says how many more there are", () => {
    const list = Array.from({ length: 23 }, (_, i) =>
      tx(`t${i}`, `Row ${i}`, new Date(2026, 5, 1 + (i % 28)))
    );
    render(
      <PeriodTransactionsList
        title="Payments"
        transactions={list}
        displayCurrency="USD"
        onDelete={jest.fn()}
        deletingId={null}
      />
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(20);
    expect(screen.getByText("and 3 more in this period")).toBeInTheDocument();
  });
});
