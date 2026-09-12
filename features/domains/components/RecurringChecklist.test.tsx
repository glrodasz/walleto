import { fireEvent, render, screen, within } from "@testing-library/react";
import { RecurringChecklist } from "./RecurringChecklist";
import { monthWindows } from "../helpers/months";
import { IDENTITY_RATES } from "../../../helpers/fx";
import { occurrenceId } from "../../../helpers/materializeOccurrences";
import type { Currency, RecurrentTransaction, Timestamp, Transaction } from "../../../types";

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
  });

  it("groups the month into overdue, due and paid, and folds the rest away", () => {
    setup();
    const groups = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(groups[0]).toContain("Overdue");
    expect(groups[1]).toContain("Due");
    expect(groups[2]).toContain("Paid");

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
    expect(onMarkPaid).toHaveBeenCalledWith("Rent");

    fireEvent.click(screen.getByRole("button", { name: "Actions for Netflix" }));
    expect(screen.queryByRole("menuitem", { name: "Mark as paid" })).toBeNull();
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith(netflix);

    fireEvent.click(screen.getByRole("button", { name: "Actions for Gym" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Stop" }));
    expect(onStop).toHaveBeenCalledWith("Gym");
  });

  it("shows the empty state without items", () => {
    setup({ items: [], transactions: [] });
    expect(screen.getByText("No recurring expenses yet")).toBeInTheDocument();
  });
});
