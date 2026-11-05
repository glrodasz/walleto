import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { DebtSummaryRow } from "../helpers/debtSummary";
import type { Category } from "../../../types";

const createTransaction = jest.fn(async (input: unknown) => {
  void input;
  return "tx-new";
});
jest.mock("../../../hooks/useTransactions", () => ({
  createTransaction: (input: unknown) => createTransaction(input),
}));
jest.mock("../../../hooks/useEnabledCurrencies", () => ({
  useEnabledCurrencies: () => ({ optionsFor: () => [{ value: "USD", label: "$ USD" }] }),
}));

import { DebtPaymentModal } from "./DebtPaymentModal";
import type { DebtPaymentMode } from "./DebtPaymentModal";
import { IDENTITY_RATES } from "../../../helpers/fx";

const debt = {
  row: {
    key: "acc:ana",
    selector: { accountId: "ana" },
    name: "Loan from Ana",
    currency: "USD",
    invested: 400,
    value: 1_100,
    latest: null,
    gainPct: null,
    known: true,
    borrowed: 1_500,
  },
  monthly: 100,
  paidOff: false,
  categoryId: "cat-friends",
} as DebtSummaryRow;

const categories = [
  { id: "cat-friends", userId: "u1", domain: "DEBT", name: "Friends" },
] as Category[];

const modal = (mode: DebtPaymentMode) =>
  render(
    <DebtPaymentModal
      mode={mode}
      debt={debt}
      categories={categories}
      ctx={{ rates: IDENTITY_RATES, target: "USD" }}
      onClose={() => {}}
    />
  );

beforeEach(() => createTransaction.mockClear());

describe("DebtPaymentModal", () => {
  it("pays part of a debt as a one-off repayment on it, prefilled with the monthly payment", async () => {
    modal("part");
    expect(screen.getByLabelText(/Amount/)).toHaveValue("100");
    fireEvent.click(screen.getByRole("button", { name: "Pay" }));
    await waitFor(() => expect(createTransaction).toHaveBeenCalled());
    expect(createTransaction.mock.calls[0][0]).toMatchObject({
      domain: "DEBT",
      accountId: "ana",
      categoryId: "cat-friends",
      amount: 100,
      status: "PAID",
    });
    expect(createTransaction.mock.calls[0][0]).not.toHaveProperty("direction");
  });

  it("pays it all, prefilled with the balance", () => {
    modal("all");
    expect(screen.getByLabelText(/Amount/)).toHaveValue("1100");
  });

  it("writes more borrowing as money out of the debt", async () => {
    modal("borrow");
    fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: "300" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(createTransaction).toHaveBeenCalled());
    expect(createTransaction.mock.calls[0][0]).toMatchObject({ amount: 300, direction: "OUT" });
  });
});
