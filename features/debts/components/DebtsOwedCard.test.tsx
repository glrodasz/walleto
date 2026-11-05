import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AccountValueRow } from "../../investments/helpers/domainValue";
import type { Category } from "../../../types";

let rows: AccountValueRow[];
const createTransaction = jest.fn(async (input: unknown) => {
  void input;
  return "tx-new";
});

jest.mock("../../investments/hooks/useDomainValue", () => ({
  useDomainValue: () => ({ rows, transactions: [], loading: false, error: null }),
}));
jest.mock("../../../hooks/useTransactions", () => ({
  createTransaction: (input: unknown) => createTransaction(input),
}));
jest.mock("../../../hooks/useEnabledCurrencies", () => ({
  useEnabledCurrencies: () => ({ optionsFor: () => [{ value: "USD", label: "$ USD" }] }),
}));
jest.mock("../../investments/components/ValuationModal", () => ({
  ValuationModal: ({ name }: { name: string }) => <div>Balance form for {name}</div>,
}));

import { DebtsOwedCard } from "./DebtsOwedCard";
import { IDENTITY_RATES } from "../../../helpers/fx";

const row = (accountId: string, value: number, over: Partial<AccountValueRow> = {}) =>
  ({
    key: `acc:${accountId}`,
    selector: { accountId },
    name: accountId,
    currency: "USD",
    invested: 0,
    value,
    latest: null,
    gainPct: null,
    known: true,
    borrowed: 0,
    ...over,
  }) as AccountValueRow;

const categories = [
  { id: "cat-friends", userId: "u1", domain: "DEBT", name: "Friends" },
] as Category[];

const card = () =>
  render(
    <DebtsOwedCard
      categories={categories}
      items={[]}
      ctx={{ rates: IDENTITY_RATES, target: "USD" }}
      currency="USD"
    />
  );

beforeEach(() => {
  createTransaction.mockClear();
  rows = [row("Loan from Ana", 1_100, { borrowed: 1_500 }), row("Car loan", 0, { known: false })];
});

describe("DebtsOwedCard", () => {
  it("adds up what is owed and says which debts have no balance yet", () => {
    card();
    expect(screen.getByText("What you owe")).toBeInTheDocument();
    expect(screen.getAllByText("$1,100.00").length).toBeGreaterThan(0);
    expect(screen.getByText("1 debt has no balance yet and is left out.")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("pays part of a debt as a one-off repayment on it", async () => {
    card();
    fireEvent.click(screen.getByRole("button", { name: "Pay" }));
    fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: "200" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Pay" }).at(-1)!);
    await waitFor(() => expect(createTransaction).toHaveBeenCalled());
    expect(createTransaction.mock.calls[0][0]).toMatchObject({
      domain: "DEBT",
      accountId: "Loan from Ana",
      categoryId: "cat-friends",
      amount: 200,
      status: "PAID",
    });
    expect(createTransaction.mock.calls[0][0]).not.toHaveProperty("direction");
  });

  it("opens the balance form for a debt with no balance yet", () => {
    card();
    fireEvent.click(screen.getByRole("button", { name: "Update balance" }));
    expect(screen.getByText("Balance form for Car loan")).toBeInTheDocument();
  });

  it("hides when there are no debts", () => {
    rows = [];
    const { container } = card();
    expect(container).toBeEmptyDOMElement();
  });
});
