import { fireEvent, render, screen, within } from "@testing-library/react";
import { RecurringChecklist } from "./RecurringChecklist";
import { monthWindows } from "../helpers/months";
import { IDENTITY_RATES } from "../../../helpers/fx";
import { occurrenceId } from "../../../helpers/materializeOccurrences";
import type { Currency, RecurrentTransaction, Timestamp, Transaction } from "../../../types";
import { DEFAULT_PREFERENCES, PreferencesContext } from "../../../hooks/usePreferences";

const now = new Date(2026, 8, 6, 15);
const sep = monthWindows(1, now)[0];
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

const rent = item("Rent", 15_000, new Date(2026, 2, 25, 12), { paymentMethodId: "m1" });
const netflix = item("Netflix", 150, new Date(2026, 2, 3, 12));
const gym = item("Gym", 400, new Date(2026, 2, 2, 12));
const insurance = item("Insurance", 1_200, new Date(2026, 0, 15, 12), {
  frequency: "YEARLY",
  nextOccurrence: ts(new Date(2027, 0, 15, 12)),
});

const paidNetflix: Transaction = {
  id: occurrenceId("Netflix", new Date(2026, 8, 3, 12)),
  userId: "u1",
  domain: "EXPENSE",
  categoryId: "c1",
  recurrentTransactionId: "Netflix",
  name: "Netflix",
  amount: 150,
  currency: "USD",
  occurredAt: ts(new Date(2026, 8, 3, 12)),
  status: "PAID",
};

const methods = [
  {
    id: "m1",
    userId: "u1",
    name: "Chase",
    type: "CREDIT_CARD",
    last4: "4242",
    currencies: ["USD"],
  },
] as never;

function setup(overrides: Partial<React.ComponentProps<typeof RecurringChecklist>> = {}) {
  const onMarkPaid = jest.fn();
  const onEdit = jest.fn();
  const onStop = jest.fn();
  render(
    <RecurringChecklist
      domain="EXPENSE"
      items={[rent, netflix, gym, insurance]}
      transactions={[paidNetflix]}
      paymentMethods={methods}
      categories={[{ id: "c1", userId: "u1", domain: "EXPENSE", name: "Housing" }] as never}
      ctx={ctx}
      currency="USD"
      window={sep}
      now={now}
      onMarkPaid={onMarkPaid}
      onEdit={onEdit}
      onStop={onStop}
      busyId={null}
      {...overrides}
    />
  );
  return { onMarkPaid, onEdit, onStop };
}

describe("RecurringChecklist", () => {
  it("flags an item hidden from the dashboard", () => {
    const hiddenGym = item("Gym", 400, new Date(2026, 2, 2, 12), { hiddenFromDashboard: true });
    setup({ items: [rent, netflix, hiddenGym, insurance] });
    const row = screen.getByText("Gym").closest("li")!;
    expect(within(row).getByText("Hidden")).toBeInTheDocument();
    // No other row claims it.
    expect(screen.getAllByText("Hidden")).toHaveLength(1);
    // Off the dashboard only: it still counts on this page, so it stays lit.
    expect(row).not.toHaveClass("is-muted");
  });

  it("tags a variable item, and only that one", () => {
    const power = item("Power", 900, new Date(2026, 2, 28, 12), { amountFloor: 500 });
    setup({ items: [rent, netflix, gym, power] });
    const row = screen.getByText("Power").closest("li")!;
    expect(within(row).getByText("Variable")).toBeInTheDocument();
    expect(screen.getAllByText("Variable")).toHaveLength(1);
  });

  it("puts a variable item's average of the last six months on its Variable pill", () => {
    const power = item("Power", 900, new Date(2026, 2, 28, 12), { amountFloor: 500 });
    const paid = (month: number, amount: number, overrides: Partial<Transaction> = {}) => ({
      ...paidNetflix,
      id: `power-${month}`,
      recurrentTransactionId: "Power",
      name: "Power",
      amount,
      occurredAt: ts(new Date(2026, month, 28, 12)),
      ...overrides,
    });
    setup({
      items: [rent, power],
      transactions: [
        paid(5, 600),
        paid(6, 700),
        // Still an estimate: says nothing about what was spent.
        paid(7, 900, { amountFloor: 500 }),
        // Older than six months.
        paid(1, 5_000),
      ],
    });
    const row = screen.getByText("Power").closest("li")!;
    expect(within(row).getByText("avg $650.00 · 2 mo")).toBeInTheDocument();
    // Explained on tap or focus, not by a title nobody on a phone can see.
    const about = within(row).getByRole("button", { name: "Variable, avg $650.00 · 2 mo" });
    expect(about).toHaveAccessibleDescription(expect.stringContaining("2 months"));
    // A fixed item has no pill, so no average.
    expect(screen.getAllByText(/^avg /)).toHaveLength(1);
  });

  it("shows no average for a variable item with nothing confirmed yet", () => {
    const power = item("Power", 900, new Date(2026, 2, 28, 12), { amountFloor: 500 });
    setup({ items: [power], transactions: [] });
    expect(screen.queryByText(/^avg /)).not.toBeInTheDocument();
  });

  it("hides an item from the dashboard through the kebab — never from the chart", () => {
    const onToggleHidden = jest.fn();
    setup({ onToggleHidden });

    fireEvent.click(screen.getByRole("button", { name: "Actions for Gym" }));
    expect(screen.queryByRole("menuitem", { name: /chart/ })).toBeNull();
    fireEvent.click(screen.getByRole("menuitem", { name: "Hide from dashboard" }));
    expect(onToggleHidden).toHaveBeenCalledWith(gym);
  });

  it("groups the month into overdue, due and paid, and folds the rest away", () => {
    setup();
    const groups = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(groups[0]).toContain("Overdue");
    expect(groups[1]).toContain("Due");
    expect(groups[2]).toContain("Paid");
    // Each total keeps the kebab's room, so it sits over the rows' amounts.
    for (const h of screen.getAllByRole("heading", { level: 3 })) {
      expect(h.querySelector(".kebab-spacer")).not.toBeNull();
    }

    const overdue = screen.getByText("Gym").closest("li")!;
    expect(within(overdue).getByText("Overdue")).toBeInTheDocument();
    const due = screen.getByText("Rent").closest("li")!;
    expect(within(due).getByText("Due")).toBeInTheDocument();
    expect(
      within(due).getByText(/Sep 25 · Monthly · Housing · Chase ••4242 \(Credit card\)/)
    ).toBeInTheDocument();
    const paid = screen.getByText("Netflix").closest("li")!;
    expect(within(paid).getByText("Paid")).toBeInTheDocument();

    expect(screen.getByText("Not this month (1)")).toBeInTheDocument();
    expect(screen.getByText(/Yearly · next Jan 15/)).toBeInTheDocument();
    expect(screen.getByText(/Planned monthly expenses/)).toBeInTheDocument();
  });

  it("offers Mark as paid only for unpaid occurrences, plus Edit and Stop", () => {
    const { onMarkPaid, onEdit, onStop } = setup();

    fireEvent.click(screen.getByRole("button", { name: "Actions for Rent" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Mark as paid" }));
    expect(onMarkPaid).toHaveBeenCalledWith("Rent", expect.any(Date));

    fireEvent.click(screen.getByRole("button", { name: "Actions for Netflix" }));
    expect(screen.queryByRole("menuitem", { name: "Mark as paid" })).toBeNull();
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith(netflix);

    fireEvent.click(screen.getByRole("button", { name: "Actions for Gym" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Stop" }));
    expect(onStop).toHaveBeenCalledWith("Gym");
  });

  it("reads as the plan, with what was paid on the pill only when it differs", () => {
    // Netflix went up to 180 after September's 150 was paid on the 5th, not the 3rd.
    const raised = { ...netflix, amount: 180 };
    setup({
      items: [rent, raised, gym],
      transactions: [{ ...paidNetflix, occurredAt: ts(new Date(2026, 8, 5, 12)) }],
    });
    const row = screen.getByText("Netflix").closest("li")!;
    expect(within(row).getByText("$180.00")).toBeInTheDocument();
    expect(within(row).getByText("Paid").textContent).toBe("Paid$150.00");
    expect(within(row).getByText(/^Sep 3 → Sep 5 · Monthly/)).toBeInTheDocument();
  });

  it("adds nothing when the payment matches the plan", () => {
    setup();
    const row = screen.getByText("Netflix").closest("li")!;
    expect(within(row).getByText("Paid").textContent).toBe("Paid");
    expect(within(row).getByText(/^Sep 3 · Monthly/)).toBeInTheDocument();
  });

  it("shows a payment removed from Activity as skipped, not overdue", () => {
    const { onMarkPaid } = setup({
      transactions: [],
      skipped: [{ ...paidNetflix, status: "SKIPPED" }],
    });
    const row = screen.getByText("Netflix").closest("li")!;
    expect(within(row).getByText("Skipped")).toBeInTheDocument();
    expect(row).toHaveClass("is-muted");
    const groups = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(groups[groups.length - 1]).toBe("Skipped");

    // Marking it paid writes the payment back.
    fireEvent.click(screen.getByRole("button", { name: "Actions for Netflix" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Mark as paid" }));
    expect(onMarkPaid).toHaveBeenCalledWith("Netflix", new Date(2026, 8, 3, 12));
  });

  it("shows the empty state without items", () => {
    setup({ items: [], transactions: [] });
    expect(screen.getByText(/Nothing in your plan yet/)).toBeInTheDocument();
  });

  it("speaks Spanish: groups, cadence, actions and the run-rate line", () => {
    const onToggleHidden = jest.fn();
    render(
      <PreferencesContext.Provider value={{ ...DEFAULT_PREFERENCES, language: "es" }}>
        <RecurringChecklist
          domain="EXPENSE"
          items={[rent, netflix, gym, insurance]}
          transactions={[paidNetflix]}
          paymentMethods={methods}
          categories={[{ id: "c1", userId: "u1", domain: "EXPENSE", name: "Housing" }] as never}
          ctx={ctx}
          currency="USD"
          window={monthWindows(1, now, "es")[0]}
          now={now}
          onMarkPaid={jest.fn()}
          onEdit={jest.fn()}
          onStop={jest.fn()}
          onToggleHidden={onToggleHidden}
          busyId={null}
        />
      </PreferencesContext.Provider>
    );
    const groups = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(groups[0]).toContain("Vencidos");
    expect(groups[1]).toContain("Pendientes");
    expect(groups[2]).toContain("Pagados");
    const due = screen.getByText("Rent").closest("li")!;
    expect(within(due).getByText(/Mensual · Housing/)).toBeInTheDocument();
    expect(screen.getByText("No es de este mes (1)")).toBeInTheDocument();
    expect(screen.getByText(/Gastos mensuales planeados:/)).toHaveTextContent(
      "Gastos mensuales planeados: $15,650.00/mes"
    );

    fireEvent.click(screen.getByRole("button", { name: "Acciones de Gym" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Ocultar de Inicio" }));
    expect(onToggleHidden).toHaveBeenCalledWith(gym);
  });
});
