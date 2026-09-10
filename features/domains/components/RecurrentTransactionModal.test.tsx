import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RecurrentTransactionModal } from "./RecurrentTransactionModal";
import { anchorStartDate } from "../../../helpers/scheduleAnchor";

const createItem = jest.fn().mockResolvedValue("item1");
let recurringItems: unknown[] = [];
const updateItem = jest.fn().mockResolvedValue(undefined);
const createTransaction = jest.fn().mockResolvedValue("tx1");
const updateTransaction = jest.fn().mockResolvedValue(undefined);
const materializeNow = jest.fn().mockResolvedValue(undefined);

jest.mock("../../../hooks/useUserDoc", () => ({
  useUserDoc: () => ({ userDoc: { mainCurrency: "USD" } }),
}));
jest.mock("../../../hooks/useCategories", () => ({
  useCategories: () => ({
    categories: [{ id: "c1", userId: "u", domain: "EXPENSE", name: "Groceries" }],
    loading: false,
    error: null,
    create: jest.fn(),
  }),
}));
jest.mock("../../../hooks/usePaymentMethods", () => ({
  usePaymentMethods: () => ({ methods: [], create: jest.fn() }),
}));
jest.mock("../../../hooks/useTags", () => ({
  useTags: () => ({ tags: [], loading: false, error: null, create: jest.fn() }),
}));
jest.mock("../../../hooks/useAccounts", () => ({
  useAccounts: () => ({ accounts: [], loading: false, error: null, create: jest.fn() }),
}));
jest.mock("../../../hooks/useRecurrentTransactions", () => ({
  useRecurrentTransactions: () => ({
    items: recurringItems,
    create: createItem,
    update: updateItem,
  }),
}));
jest.mock("../../../hooks/useTransactions", () => ({
  createTransaction: (...args: unknown[]) => createTransaction(...args),
  updateTransaction: (...args: unknown[]) => updateTransaction(...args),
}));
jest.mock("../../../hooks/useMaterialize", () => ({
  materializeNow: () => materializeNow(),
}));
jest.mock("../../../hooks/useInvestmentValuations", () => ({
  createInvestmentValuation: jest.fn(),
}));

beforeEach(() => {
  recurringItems = [];
  createItem.mockClear();
  updateItem.mockClear();
  createTransaction.mockClear();
  updateTransaction.mockClear();
  materializeNow.mockClear();
});

function fill() {
  fireEvent.change(screen.getByLabelText("Category"), { target: { value: "c1" } });
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Laptop" } });
  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "2000" } });
}

describe("RecurrentTransactionModal — one time vs recurring", () => {
  it("records a one-time entry as a plain transaction, not a plan", async () => {
    const onClose = jest.fn();
    render(<RecurrentTransactionModal domain="EXPENSE" open onClose={onClose} />);
    fill();
    fireEvent.change(screen.getByLabelText("Frequency"), { target: { value: "ONE_TIME" } });
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-09-04" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createItem).not.toHaveBeenCalled();
    expect(materializeNow).not.toHaveBeenCalled();
    expect(createTransaction).toHaveBeenCalledWith({
      domain: "EXPENSE",
      categoryId: "c1",
      name: "Laptop",
      amount: 2000,
      currency: "USD",
      occurredAt: anchorStartDate({ frequency: "ONE_TIME", date: "2026-09-04" }).toISOString(),
      status: "PAID",
    });
  });

  it("still creates a recurrent item for a monthly schedule", async () => {
    const onClose = jest.fn();
    render(<RecurrentTransactionModal domain="EXPENSE" open onClose={onClose} />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createTransaction).not.toHaveBeenCalled();
    expect(createItem).toHaveBeenCalledWith(expect.objectContaining({ frequency: "MONTHLY" }));
  });
});

describe("RecurrentTransactionModal — one-off entry point", () => {
  it("opens on One time with the domain's copy and saves a PAID transaction", async () => {
    const onClose = jest.fn();
    render(
      <RecurrentTransactionModal
        domain="EXPENSE"
        open
        initialFrequency="ONE_TIME"
        onClose={onClose}
      />
    );
    expect(screen.getByRole("dialog", { name: "Record a payment" })).toBeInTheDocument();
    expect(screen.getByLabelText("Frequency")).toHaveValue("ONE_TIME");
    expect(screen.getByLabelText("Name")).toHaveAttribute("placeholder", "Groceries");

    fill();
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-09-04" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createItem).not.toHaveBeenCalled();
    expect(createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ domain: "EXPENSE", status: "PAID", amount: 2000 })
    );
  });
});

describe("RecurrentTransactionModal — editing a transaction", () => {
  const existing = {
    id: "t9",
    userId: "u",
    domain: "EXPENSE" as const,
    categoryId: "c1",
    name: "Bread",
    amount: 12.5,
    currency: "USD" as const,
    occurredAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date(2026, 8, 3, 12) },
    status: "PAID" as const,
  };

  it("prefills the row, pins the frequency, and patches only what changed", async () => {
    const onClose = jest.fn();
    render(
      <RecurrentTransactionModal domain="EXPENSE" open transaction={existing} onClose={onClose} />
    );

    expect(screen.getByRole("dialog", { name: "Edit Bread" })).toBeInTheDocument();
    expect(screen.getByLabelText("Frequency")).toHaveValue("ONE_TIME");
    expect(screen.getByLabelText("Frequency")).toBeDisabled();
    expect(screen.getByLabelText("Name")).toHaveValue("Bread");
    expect(screen.getByLabelText("Amount")).toHaveValue("12.5");
    expect(screen.getByLabelText("Date")).toHaveValue("2026-09-03");

    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "14" } });
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-09-04" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(updateTransaction).toHaveBeenCalledWith("t9", {
      amount: 14,
      occurredAt: anchorStartDate({ frequency: "ONE_TIME", date: "2026-09-04" }).toISOString(),
    });
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it("does not call the API when nothing changed", async () => {
    const onClose = jest.fn();
    render(
      <RecurrentTransactionModal domain="EXPENSE" open transaction={existing} onClose={onClose} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(updateTransaction).not.toHaveBeenCalled();
  });
});

describe("RecurrentTransactionModal — charged pair belongs to one-offs", () => {
  const toggle = () => screen.queryByLabelText(/My card was charged a different amount/);

  it("hides the toggle on a recurring schedule and never sends the pair", async () => {
    const onClose = jest.fn();
    render(<RecurrentTransactionModal domain="EXPENSE" open onClose={onClose} />);
    expect(toggle()).toBeNull();
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createItem.mock.calls[0][0]).not.toHaveProperty("chargedAmount");
  });

  it("offers it on One time and on a ledger row", () => {
    const { unmount } = render(
      <RecurrentTransactionModal
        domain="EXPENSE"
        open
        initialFrequency="ONE_TIME"
        onClose={jest.fn()}
      />
    );
    expect(toggle()).toBeInTheDocument();
    unmount();
    render(
      <RecurrentTransactionModal
        domain="EXPENSE"
        open
        transaction={{
          id: "t1",
          userId: "u",
          domain: "EXPENSE",
          categoryId: "c1",
          name: "Bread",
          amount: 5,
          currency: "USD",
          chargedAmount: 20000,
          chargedCurrency: "COP",
          occurredAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date(2026, 8, 3, 12) },
          status: "PAID",
        }}
        onClose={jest.fn()}
      />
    );
    expect(toggle()).toBeChecked();
    expect(screen.getByLabelText("Charged amount")).toHaveValue("20000");
  });
});

describe("RecurrentTransactionModal — inheritance", () => {
  const existing = {
    id: "rt1",
    userId: "u",
    domain: "EXPENSE" as const,
    categoryId: "c1",
    name: "Netflix",
    amount: 15,
    currency: "USD" as const,
    frequency: "MONTHLY" as const,
    startDate: { seconds: 0, nanoseconds: 0, toDate: () => new Date(2026, 0, 15, 12) },
    active: true,
    note: "Family plan",
    inheritNote: false,
  };

  it("sends the inherit flags on create and hides them on One time", () => {
    const { unmount } = render(
      <RecurrentTransactionModal domain="EXPENSE" open onClose={jest.fn()} />
    );
    expect(screen.getByLabelText("Apply the note to each payment")).toBeInTheDocument();
    unmount();
    render(
      <RecurrentTransactionModal
        domain="EXPENSE"
        open
        initialFrequency="ONE_TIME"
        onClose={jest.fn()}
      />
    );
    expect(screen.queryByLabelText("Apply the note to each payment")).toBeNull();
  });

  it("offers to update existing payments when inheritance is switched on, and sends applyToExisting", async () => {
    const onClose = jest.fn();
    render(<RecurrentTransactionModal domain="EXPENSE" open item={existing} onClose={onClose} />);
    expect(screen.queryByLabelText(/Also update the existing payments/)).toBeNull();

    fireEvent.click(screen.getByLabelText("Apply the note to each payment"));
    const also = screen.getByLabelText(/Also update the existing payments/);
    fireEvent.click(also);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(updateItem).toHaveBeenCalledWith(
      "rt1",
      expect.objectContaining({ note: "Family plan", inheritNote: true, applyToExisting: true })
    );
  });

  it("does not send applyToExisting when the box is left unticked", async () => {
    const onClose = jest.fn();
    render(<RecurrentTransactionModal domain="EXPENSE" open item={existing} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Apply the note to each payment"));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(updateItem.mock.calls[0][1]).not.toHaveProperty("applyToExisting");
  });
});

describe("RecurrentTransactionModal — a row's recurring item", () => {
  const netflix = {
    id: "rt1",
    userId: "u",
    domain: "EXPENSE" as const,
    categoryId: "c1",
    name: "Netflix",
    amount: 15,
    currency: "USD" as const,
    frequency: "MONTHLY" as const,
    startDate: { seconds: 0, nanoseconds: 0, toDate: () => new Date(2026, 0, 15, 12) },
    nextOccurrence: { seconds: 0, nanoseconds: 0, toDate: () => new Date(2026, 9, 15, 12) },
    active: true,
  };
  const row = {
    id: "t9",
    userId: "u",
    domain: "EXPENSE" as const,
    recurrentTransactionId: "rt1",
    categoryId: "c1",
    name: "Netflix",
    amount: 15,
    currency: "USD" as const,
    occurredAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date(2026, 8, 15, 12) },
    status: "PAID" as const,
  };

  it("names the item and hands off to its editor", () => {
    recurringItems = [netflix];
    const onOpenItem = jest.fn();
    render(
      <RecurrentTransactionModal
        domain="EXPENSE"
        open
        transaction={row}
        onOpenItem={onOpenItem}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText(/Part of the recurring item/)).toHaveTextContent(
      "Netflix · Monthly · next Oct 15"
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit the recurring item" }));
    expect(onOpenItem).toHaveBeenCalledWith(netflix);
  });

  it("says nothing when the item is gone", () => {
    render(
      <RecurrentTransactionModal domain="EXPENSE" open transaction={row} onClose={jest.fn()} />
    );
    expect(screen.queryByText(/Part of the recurring item/)).toBeNull();
  });
});

describe("RecurrentTransactionModal — reflect monthly", () => {
  it("offers the spread only for non-monthly cadences and sends the flag", async () => {
    const onClose = jest.fn();
    render(<RecurrentTransactionModal domain="EXPENSE" open onClose={onClose} />);
    expect(screen.queryByLabelText(/Reflect it as a monthly amount/)).toBeNull();

    fill();
    fireEvent.change(screen.getByLabelText("Frequency"), { target: { value: "YEARLY" } });
    const box = screen.getByLabelText(/Reflect it as a monthly amount/);
    expect(box.closest("label")).toHaveTextContent("$166.67 a month");
    fireEvent.click(box);
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createItem).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: "YEARLY", spreadMonthly: true })
    );
  });
});
