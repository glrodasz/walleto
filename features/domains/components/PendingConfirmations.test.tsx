import { fireEvent, render, screen } from "@testing-library/react";
import { PendingConfirmations } from "./PendingConfirmations";
import type { Category, Transaction } from "../../../types";

const date = new Date(2026, 8, 6, 9);
const row = {
  id: "g_2026-09-06",
  userId: "u1",
  domain: "EXPENSE",
  categoryId: "c1",
  name: "Groceries",
  amount: 600,
  amountFloor: 400,
  currency: "USD",
  occurredAt: { seconds: date.getTime() / 1000, nanoseconds: 0, toDate: () => date },
  status: "PAID",
} as Transaction;
const categories = [{ id: "c1", name: "Food", domain: "EXPENSE" }] as Category[];

describe("PendingConfirmations", () => {
  it("renders nothing when no period is waiting", () => {
    const { container } = render(
      <PendingConfirmations
        rows={[]}
        categories={categories}
        displayCurrency="USD"
        onConfirm={jest.fn()}
        onKeepVariable={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists each row with its band and both ways out", () => {
    const onConfirm = jest.fn();
    const onKeepVariable = jest.fn();
    render(
      <PendingConfirmations
        rows={[row]}
        categories={categories}
        displayCurrency="USD"
        onConfirm={onConfirm}
        onKeepVariable={onKeepVariable}
      />
    );
    expect(screen.getByText("To confirm")).toBeInTheDocument();
    expect(screen.getByText("$400.00 –")).toBeInTheDocument();
    expect(screen.getByText("$600.00")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm Groceries" }));
    expect(onConfirm).toHaveBeenCalledWith(row);
    fireEvent.click(screen.getByRole("button", { name: "Actions for Groceries" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Keep it variable" }));
    expect(onKeepVariable).toHaveBeenCalledWith(row);
  });
});
