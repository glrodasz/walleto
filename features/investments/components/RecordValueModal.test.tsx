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
jest.mock("../../../hooks/useCategories", () => ({
  useCategories: () => ({
    categories: [
      { id: "funds", userId: "u", domain: "INVESTMENT", name: "Index funds" },
      { id: "sub", userId: "u", domain: "INVESTMENT", name: "Child", parentId: "funds" },
      { id: "crypto", userId: "u", domain: "INVESTMENT", name: "Crypto" },
    ],
  }),
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
    ],
    loading: false,
    error: null,
  }),
}));

beforeEach(() => valuationModalMock.mockClear());

describe("RecordValueModal", () => {
  it("lets the user pick an investment, shows what went in, then hands off to the value form", () => {
    render(<RecordValueModal open onClose={jest.fn()} />);
    const select = screen.getByLabelText("Investment") as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual([
      "Pick an investment",
      "Index funds",
      "Crypto",
    ]);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    fireEvent.change(select, { target: { value: "funds" } });
    expect(screen.getByText("$130.00")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(valuationModalMock).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: "funds",
        categoryName: "Index funds",
        costBasis: 130,
        currency: "USD",
        open: true,
      })
    );
  });

  it("skips the picker when the category is given", () => {
    render(<RecordValueModal open categoryId="crypto" onClose={jest.fn()} />);
    expect(screen.queryByLabelText("Investment")).toBeNull();
    expect(valuationModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: "crypto", costBasis: 0 })
    );
  });
});
