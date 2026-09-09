import { fireEvent, render, screen } from "@testing-library/react";
import { RecordValueModal } from "./RecordValueModal";
import { IDENTITY_RATES } from "../../../helpers/fx";

const valuationModalMock = jest.fn((_props: unknown) => null);
jest.mock("./ValuationModal", () => ({
  ValuationModal: (props: unknown) => valuationModalMock(props),
}));
jest.mock("../../../hooks/useMoneyContext", () => ({
  useMoneyContext: () => ({ ctx: { rates: IDENTITY_RATES, target: "USD" }, target: "USD" }),
}));
let accounts: unknown[] = [];
jest.mock("../../../hooks/useAccounts", () => ({
  useAccounts: () => ({ accounts, loading: false, error: null }),
}));
let categories: unknown[] = [];
jest.mock("../../../hooks/useCategories", () => ({
  useCategories: () => ({ categories }),
}));
jest.mock("../../../hooks/useDomainTransactions", () => ({
  useDomainTransactions: () => ({
    transactions: [
      {
        id: "t1",
        userId: "u",
        domain: "INVESTMENT",
        categoryId: "funds",
        name: "Buy",
        amount: 130,
        currency: "USD",
        status: "PAID",
        occurredAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date(2026, 0, 10) },
      },
      {
        id: "t2",
        userId: "u",
        domain: "INVESTMENT",
        categoryId: "funds",
        accountId: "isk",
        name: "DCA",
        amount: 500,
        currency: "USD",
        status: "PAID",
        occurredAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date(2026, 1, 10) },
      },
    ],
    loading: false,
    error: null,
  }),
}));

beforeEach(() => {
  valuationModalMock.mockClear();
  accounts = [
    { id: "isk", userId: "u", domain: "INVESTMENT", name: "Avanza ISK", currency: "USD" },
  ];
  categories = [
    { id: "funds", userId: "u", domain: "INVESTMENT", name: "Index funds" },
    { id: "sub", userId: "u", domain: "INVESTMENT", name: "Child", parentId: "funds" },
    { id: "crypto", userId: "u", domain: "INVESTMENT", name: "Crypto" },
  ];
});

describe("RecordValueModal", () => {
  it("offers accounts and categories with unassigned entries, shows what went in, then hands off", () => {
    render(<RecordValueModal open domain="INVESTMENT" onClose={jest.fn()} />);
    const select = screen.getByLabelText("Account") as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual([
      "Pick an account",
      "Avanza ISK",
      "Index funds · no account",
    ]);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    fireEvent.change(select, { target: { value: "acc:isk" } });
    expect(screen.getByText("$500.00")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(valuationModalMock).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: { accountId: "isk" },
        name: "Avanza ISK",
        costBasis: 500,
        currency: "USD",
        open: true,
      })
    );
  });

  it("explains when there is nothing to value", () => {
    accounts = [];
    categories = [];
    render(<RecordValueModal open domain="SAVING" onClose={jest.fn()} />);
    expect(screen.queryByLabelText("Pocket")).toBeNull();
    expect(screen.getByText(/No pocket to value yet/)).toBeInTheDocument();
  });
});
