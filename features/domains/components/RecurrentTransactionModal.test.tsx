import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RecurrentTransactionModal } from "./RecurrentTransactionModal";
import { anchorStartDate } from "../../../helpers/scheduleAnchor";

const createItem = jest.fn().mockResolvedValue("item1");
const createTransaction = jest.fn().mockResolvedValue("tx1");
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
jest.mock("../../../hooks/useRecurrentTransactions", () => ({
  useRecurrentTransactions: () => ({ create: createItem, update: jest.fn() }),
}));
jest.mock("../../../hooks/useTransactions", () => ({
  createTransaction: (...args: unknown[]) => createTransaction(...args),
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
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

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
