import { fireEvent, render, screen, within } from "@testing-library/react";
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
    expect(screen.getByText("No activity in this period")).toBeInTheDocument();
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

  it("says which rule hid a row — the chart or the dashboard", () => {
    const { rerender } = render(
      <TransactionsTable
        {...base}
        rows={rows}
        onDelete={jest.fn()}
        hiddenReasons={(t) => (t.id === "b" ? ["dashboard"] : [])}
      />
    );
    // The pill is a short word either way; the glyph is what distinguishes
    // them, and it is aria-hidden — so assert the row that carries it.
    expect(bodyRows()[1]).toHaveTextContent("Hidden");
    expect(bodyRows()[0]).not.toHaveTextContent("Hidden");
    // Off the dashboard only: it still counts on this page, so it stays lit.
    expect(bodyRows()[1]).not.toHaveClass("is-muted");

    rerender(
      <TransactionsTable
        {...base}
        rows={rows}
        onDelete={jest.fn()}
        hiddenReasons={(t) => (t.id === "c" ? ["chart", "dashboard"] : [])}
      />
    );
    expect(within(bodyRows()[0]).getAllByText("Hidden")).toHaveLength(2);
    expect(bodyRows()[0]).toHaveClass("is-muted");
  });

  it("reads a withdrawal as a negative amount with a badge saying so", () => {
    render(
      <TransactionsTable
        {...base}
        domain="SAVING"
        onDelete={jest.fn()}
        rows={[
          tx("w", "Moved to broker", new Date(2026, 8, 6, 9), {
            domain: "SAVING",
            amount: 500,
            direction: "OUT",
            chargedAmount: 4600,
            chargedCurrency: "SEK",
          }),
        ]}
      />
    );
    expect(screen.getByText("-$500.00")).toBeInTheDocument();
    expect(screen.getByText("Withdrawal")).toBeInTheDocument();
    expect(screen.getByText(/charged -SEK 4,600/)).toBeInTheDocument();
  });

  it("converts a row in another currency and keeps the original underneath", () => {
    const rates = { ...IDENTITY_RATES, rates: { ...IDENTITY_RATES.rates, COP: 4000 } };
    render(
      <TransactionsTable
        {...base}
        ctx={{ rates, target: "USD" }}
        onDelete={jest.fn()}
        rows={[
          tx("cop", "Apartment", new Date(2026, 8, 6, 9), { amount: 400_000, currency: "COP" }),
          tx("usd", "Coffee", new Date(2026, 8, 5, 9)),
        ]}
      />
    );
    const [cop, usd] = bodyRows();
    expect(within(cop).getByText("$100.00")).toBeInTheDocument();
    expect(within(cop).getByText("COP 400,000")).toBeInTheDocument();
    // Same currency as the totals: one figure, nothing repeated under it.
    expect(within(usd).getByText("$10.00")).toBeInTheDocument();
    expect(within(usd).queryByText(/COP|USD/)).toBeNull();
  });

  it("reads an unconfirmed variable expense as its band, converted when foreign", () => {
    const rates = { ...IDENTITY_RATES, rates: { ...IDENTITY_RATES.rates, COP: 4000 } };
    render(
      <TransactionsTable
        {...base}
        ctx={{ rates, target: "USD" }}
        onDelete={jest.fn()}
        rows={[
          tx("usd", "Groceries", new Date(2026, 8, 6, 9), { amount: 600, amountFloor: 400 }),
          tx("cop", "Market", new Date(2026, 8, 5, 9), {
            amount: 800_000,
            amountFloor: 400_000,
            currency: "COP",
          }),
        ]}
      />
    );
    const [usd, cop] = bodyRows();
    expect(within(usd).getByText("$400.00 –")).toBeInTheDocument();
    expect(within(usd).getByText("$600.00")).toBeInTheDocument();
    expect(within(cop).getByText("$100.00 –")).toBeInTheDocument();
    expect(within(cop).getByText("$200.00")).toBeInTheDocument();
    expect(within(cop).getByText("COP 400,000 –")).toBeInTheDocument();
    expect(within(cop).getByText("COP 800,000")).toBeInTheDocument();
  });

  it("drops a charged pair that only repeats the row's own amount", () => {
    const rates = { ...IDENTITY_RATES, rates: { ...IDENTITY_RATES.rates, COP: 4000 } };
    render(
      <TransactionsTable
        {...base}
        ctx={{ rates, target: "USD" }}
        onDelete={jest.fn()}
        rows={[
          tx("same", "Coffee beans", new Date(2026, 8, 4, 9), {
            amount: 64_000,
            currency: "COP",
            chargedAmount: 64_000,
            chargedCurrency: "COP",
          }),
        ]}
      />
    );
    const [row] = bodyRows();
    expect(within(row).getByText("COP 64,000")).toBeInTheDocument();
    expect(row).not.toHaveTextContent("charged");
  });

  it("marks a pending variable row and offers to confirm or keep it", () => {
    const onConfirm = jest.fn();
    const onKeepVariable = jest.fn();
    const groceries = tx("g", "Groceries", new Date(2026, 8, 6, 9), {
      amount: 600,
      amountFloor: 400,
    });
    render(
      <TransactionsTable
        {...base}
        onDelete={jest.fn()}
        rows={[groceries, tx("b", "Bread", new Date(2026, 8, 5, 9))]}
        isPending={(row) => row.id === "g"}
        onConfirm={onConfirm}
        onKeepVariable={onKeepVariable}
      />
    );
    const [pending, fixed] = bodyRows();
    expect(within(pending).getByText("To confirm")).toBeInTheDocument();
    expect(within(fixed).queryByText("To confirm")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Actions for Groceries" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Confirm amount" }));
    expect(onConfirm).toHaveBeenCalledWith(groceries);
    fireEvent.click(screen.getByRole("button", { name: "Actions for Groceries" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Keep it variable" }));
    expect(onKeepVariable).toHaveBeenCalledWith(groceries);
  });

  it("tags every row of a variable expense, confirmed or not, and nothing else", () => {
    const power = {
      id: "power",
      name: "Power",
      amount: 900,
      amountFloor: 500,
      currency: "USD",
      frequency: "MONTHLY",
      startDate: ts(new Date(2026, 0, 28, 12)),
    };
    render(
      <TransactionsTable
        {...base}
        items={[power] as never}
        rows={[
          tx("est", "Power", new Date(2026, 8, 28, 9), {
            recurrentTransactionId: "power",
            amount: 900,
            amountFloor: 500,
          }),
          tx("conf", "Power", new Date(2026, 7, 28, 9), {
            recurrentTransactionId: "power",
            amount: 640,
          }),
          tx("kept", "Market", new Date(2026, 7, 20, 9), { keepVariable: true }),
          tx("b", "Bread", new Date(2026, 7, 5, 9)),
        ]}
        onDelete={jest.fn()}
      />
    );
    const [estimate, confirmed, kept, fixed] = bodyRows();
    expect(within(estimate).getByText("Variable")).toBeInTheDocument();
    expect(within(confirmed).getByText("Variable")).toBeInTheDocument();
    expect(within(kept).getByText("Variable")).toBeInTheDocument();
    expect(within(fixed).queryByText("Variable")).toBeNull();
  });

  it("labels a row paid before the item's current schedule as such", () => {
    const bear = {
      id: "bear",
      name: "Bear",
      amount: 399,
      currency: "USD",
      frequency: "YEARLY",
      startDate: ts(new Date(2026, 8, 27, 12)),
    };
    render(
      <TransactionsTable
        {...base}
        items={[bear] as never}
        rows={[
          tx("bear_2026-09-09", "Bear", new Date(2026, 8, 9, 12), {
            recurrentTransactionId: "bear",
          }),
          tx("bear_2026-09-27", "Bear", new Date(2026, 8, 27, 12), {
            recurrentTransactionId: "bear",
            amount: 399,
          }),
        ]}
        onDelete={jest.fn()}
      />
    );
    const [yearly, monthly] = bodyRows();
    expect(yearly).toHaveTextContent("recurring · Yearly");
    expect(monthly).toHaveTextContent("recurring · earlier schedule");
    expect(monthly).not.toHaveTextContent("Yearly");
  });

  it("shows a reflected monthly share as a read-only line that opens its item", () => {
    const bear = {
      id: "bear",
      name: "Bear",
      amount: 399,
      currency: "USD",
      frequency: "YEARLY",
      startDate: ts(new Date(2026, 8, 27, 12)),
    };
    const onOpenItem = jest.fn();
    render(
      <TransactionsTable
        {...base}
        items={[bear] as never}
        rows={[
          {
            ...tx("bear_spread_2026-09", "Bear", new Date(2026, 8, 1), {
              recurrentTransactionId: "bear",
              amount: 33.25,
            }),
            synthetic: true,
          } as Transaction,
        ]}
        onOpenItem={onOpenItem}
        onDelete={jest.fn()}
      />
    );
    const [row] = bodyRows();
    expect(row).toHaveTextContent("Monthly share");
    expect(row).toHaveTextContent("$399.00 yearly, reflected monthly");
    expect(within(row).queryByRole("button", { name: /actions for/i })).toBeNull();
    // No kebab, but its room is kept so the amount lines up with the others.
    expect(row.querySelector(".trailing .kebab-spacer")).not.toBeNull();
    fireEvent.click(within(row).getByRole("button", { name: /monthly share, edit Bear/ }));
    expect(onOpenItem).toHaveBeenCalledWith(bear);
  });

  it("names the payment a share spreads and the months it covers", () => {
    const insurance = {
      id: "ins",
      name: "Insurance",
      amount: 1584,
      currency: "USD",
      frequency: "YEARLY",
      startDate: ts(new Date(2026, 1, 14, 12)),
    };
    const share = (key: string, paid: boolean, amount: number, year: number) =>
      ({
        ...tx(`ins_spread_${key}`, "Insurance", new Date(year, 9, 1), {
          recurrentTransactionId: "ins",
          amount: amount / 12,
        }),
        synthetic: true,
        cycle: {
          start: new Date(year, 1, 14),
          end: new Date(year + 1, 0, 13),
          amount,
          currency: "USD",
          paid,
        },
      }) as Transaction;
    render(
      <TransactionsTable
        {...base}
        items={[insurance] as never}
        rows={[share("2026-10", true, 1440, 2026), share("2027-10", false, 1584, 2027)]}
        onOpenItem={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    const text = bodyRows().map((r) => r.textContent);
    expect(
      text.some((t) => t?.includes("yearly payment of $1,440.00Covers Feb 14, 2026 – Jan 13, 2027"))
    ).toBe(true);
    expect(
      text.some((t) =>
        t?.includes("planned yearly payment of $1,584.00Covers Feb 14, 2027 – Jan 13, 2028")
      )
    ).toBe(true);
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
