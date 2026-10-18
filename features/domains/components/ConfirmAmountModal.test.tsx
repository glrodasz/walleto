import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfirmAmountModal } from "./ConfirmAmountModal";
import type { Transaction } from "../../../types";

const updateTransaction = jest.fn().mockResolvedValue(undefined);
jest.mock("../../../hooks/useTransactions", () => ({
  updateTransaction: (...args: unknown[]) => updateTransaction(...args),
}));

jest.mock("../../../hooks/useEnabledCurrencies", () => ({
  useEnabledCurrencies: () => ({
    optionsFor: () => [
      { value: "EUR", label: "€ EUR" },
      { value: "SEK", label: "kr SEK" },
    ],
  }),
}));

const date = new Date(2026, 8, 6, 9);
const groceries = {
  id: "g_2026-09-06",
  userId: "u1",
  domain: "EXPENSE",
  categoryId: "c1",
  name: "Groceries",
  amount: 600,
  amountFloor: 400,
  currency: "EUR",
  occurredAt: { seconds: date.getTime() / 1000, nanoseconds: 0, toDate: () => date },
  status: "PAID",
} as Transaction;

beforeEach(() => updateTransaction.mockClear());

describe("ConfirmAmountModal", () => {
  it("shows the planned band and confirms by dropping the floor", async () => {
    const onClose = jest.fn();
    render(<ConfirmAmountModal transaction={groceries} onClose={onClose} />);
    expect(screen.getByText(/You planned €400.00 – €600.00 for September/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("What you really spent"), {
      target: { value: "652,40" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(updateTransaction).toHaveBeenCalledWith("g_2026-09-06", {
      amount: 652.4,
      amountFloor: null,
    });
  });

  it("sends the currency too when the money left in another one", async () => {
    const onClose = jest.fn();
    render(<ConfirmAmountModal transaction={groceries} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText("What you really spent"), {
      target: { value: "6900" },
    });
    fireEvent.change(screen.getByLabelText("Currency"), { target: { value: "SEK" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(updateTransaction).toHaveBeenCalledWith("g_2026-09-06", {
      amount: 6900,
      amountFloor: null,
      currency: "SEK",
    });
  });

  it("asks for an amount above zero before saving", () => {
    render(<ConfirmAmountModal transaction={groceries} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(screen.getByText("Enter an amount greater than zero")).toBeInTheDocument();
    expect(updateTransaction).not.toHaveBeenCalled();
  });
});
