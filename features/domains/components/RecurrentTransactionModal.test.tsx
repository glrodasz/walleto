import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RecurrentTransactionModal } from "./RecurrentTransactionModal";
import { anchorStartDate } from "../../../helpers/scheduleAnchor";

const createItem = jest.fn().mockResolvedValue("item1");
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
jest.mock("../../../hooks/useAccounts", () => ({
  useAccounts: () => ({ accounts: [], loading: false, error: null, create: jest.fn() }),
}));
jest.mock("../../../hooks/useRecurrentTransactions", () => ({
  useRecurrentTransactions: () => ({ create: createItem, update: jest.fn() }),
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
  createItem.mockClear();
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
