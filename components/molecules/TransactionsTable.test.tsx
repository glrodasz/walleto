import { fireEvent, render, screen } from "@testing-library/react";
import { TransactionsTable } from "./TransactionsTable";
import { IDENTITY_RATES } from "../../helpers/fx";
import type { Category, Currency, PaymentMethod, Timestamp, Transaction } from "../../types";

const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };

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

const categories = [
  { id: "c1", name: "Groceries", domain: "EXPENSE" },
  { id: "c2", name: "Subscriptions", domain: "EXPENSE" },
] as Category[];
const methods = [{ id: "m1", name: "Visa", type: "CREDIT_CARD", last4: "4242" }] as PaymentMethod[];

const rows = [
  tx("a", "Old coffee", new Date(2026, 8, 3, 9)),
  tx("b", "Netflix", new Date(2026, 8, 6, 8), {
    recurrentTransactionId: "r1",
    categoryId: "c2",
    paymentMethodId: "m1",
  }),
  tx("c", "Bread", new Date(2026, 8, 6, 12), {
    amount: 5,
    chargedAmount: 20000,
    chargedCurrency: "COP",
  }),
];

const base = {
  title: "Transactions",
  domain: "EXPENSE" as const,
  categories,
  methods,
  displayCurrency: "USD" as Currency,
  ctx,
  deletingId: null,
  items: [{ id: "r1", name: "Netflix", frequency: "MONTHLY" }] as never,
};

const bodyRows = () => screen.getAllByRole("listitem");
const sortControl = () => screen.getByRole("combobox", { name: "Sort" });

describe("TransactionsTable", () => {
  it("lists newest first with category, method, charged pair and origin", () => {
    render(<TransactionsTable {...base} rows={rows} onDelete={jest.fn()} />);
    const list = bodyRows();
    expect(list).toHaveLength(3);
    expect(list[0]).toHaveTextContent("Bread");
    expect(list[0]).toHaveTextContent("charged COP 20,000");
    expect(list[0]).toHaveTextContent("one-off");
    expect(list[1]).toHaveTextContent("Netflix");
    expect(list[1]).toHaveTextContent("Subscriptions");
    expect(list[1]).toHaveTextContent("Visa - 4242");
    expect(list[1]).toHaveTextContent("recurring · Monthly");
    expect(list[2]).toHaveTextContent("Old coffee");
    expect(sortControl()).toHaveValue("date-desc");
  });

  it("sorts by date and by amount", () => {
    render(<TransactionsTable {...base} rows={rows} onDelete={jest.fn()} />);
    fireEvent.change(sortControl(), { target: { value: "date-asc" } });
    expect(bodyRows()[0]).toHaveTextContent("Old coffee");

    fireEvent.change(sortControl(), { target: { value: "amount-desc" } });
    expect(bodyRows()[0]).toHaveTextContent("Old coffee");
    fireEvent.change(sortControl(), { target: { value: "amount-asc" } });
    expect(bodyRows()[0]).toHaveTextContent("Bread");
  });

  it("searches and filters, and clears", () => {
    render(<TransactionsTable {...base} rows={rows} onDelete={jest.fn()} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Search transactions" }), {
      target: { value: "net" },
    });
    expect(bodyRows()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(bodyRows()).toHaveLength(3);

    fireEvent.change(screen.getByRole("combobox", { name: "Category filter" }), {
      target: { value: "c1" },
    });
    expect(bodyRows()).toHaveLength(2);
    fireEvent.change(screen.getByRole("combobox", { name: "Method filter" }), {
      target: { value: "m1" },
    });
    expect(screen.getByText("Nothing matches these filters")).toBeInTheDocument();
  });

  it("deletes through the kebab and shows the empty state", () => {
    const onDelete = jest.fn();
    const { rerender } = render(<TransactionsTable {...base} rows={rows} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: "Actions for Bread" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith("c");

    rerender(<TransactionsTable {...base} rows={[]} onDelete={onDelete} />);
    expect(screen.getByText("Nothing recorded in this period")).toBeInTheDocument();
  });

  it("collapses the filters behind a Filters button that counts what is set", () => {
    render(<TransactionsTable {...base} rows={rows} onDelete={jest.fn()} />);
    // styled-jsx CSS applies in jsdom and its viewport is a desktop one, so the
    // toggle is correctly display:none here — which also empties its computed
    // accessible name, hence getByText rather than getByRole. It is the phone
    // affordance; at this width the panel it controls is simply open.
    const toggle = screen.getByText("Filters");
    expect(toggle.tagName).toBe("BUTTON");
    const panel = document.getElementById(toggle.getAttribute("aria-controls")!);
    expect(panel).toContainElement(screen.getByRole("combobox", { name: "Category filter" }));
    expect(panel).toContainElement(screen.getByRole("combobox", { name: "Sort" }));

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    // The badge is what says "collapsed, but narrowing": the narrowing filters
    // only, never the search (which is on screen) and never the sort.
    expect(toggle).toHaveTextContent(/^Filters$/);
    fireEvent.change(screen.getByRole("textbox", { name: "Search transactions" }), {
      target: { value: "net" },
    });
    expect(toggle).toHaveTextContent(/^Filters$/);
    fireEvent.change(screen.getByRole("combobox", { name: "Category filter" }), {
      target: { value: "c1" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Method filter" }), {
      target: { value: "m1" },
    });
    expect(toggle).toHaveTextContent("2");
  });

  it("caps the rows and leaves the method out when asked", () => {
    render(
      <TransactionsTable {...base} rows={rows} onDelete={jest.fn()} limit={2} showMethod={false} />
    );
    expect(bodyRows()).toHaveLength(2);
    expect(screen.getByText("and 1 more in this period")).toBeInTheDocument();
    expect(bodyRows()[1]).not.toHaveTextContent("Visa - 4242");
    expect(screen.queryByRole("combobox", { name: "Method filter" })).toBeNull();
  });
});
