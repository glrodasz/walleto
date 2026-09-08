import { fireEvent, render, screen } from "@testing-library/react";
import { InvestmentValueList } from "./InvestmentValueList";
import { valuationsInWindow } from "./ValuationRows";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type { Category, Currency, InvestmentValuation } from "../../../types";

const ts = (date: Date) => ({ seconds: 0, nanoseconds: 0, toDate: () => date });

jest.mock("./RecordValueModal", () => ({
  RecordValueModal: ({ categoryId }: { categoryId?: string }) => (
    <div data-testid="record">{categoryId}</div>
  ),
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
  }),
}));
jest.mock("../../../hooks/useInvestmentValuations", () => ({
  useAllInvestmentValuations: () => ({
    valuations: [
      {
        id: "v1",
        userId: "u",
        categoryId: "funds",
        asOf: { seconds: 0, nanoseconds: 0, toDate: () => new Date(2026, 8, 2) },
        gainPct: 100,
        value: 260,
        costBasis: 130,
        currency: "USD",
      },
    ],
    loading: false,
    error: null,
  }),
}));

const categories = [
  { id: "funds", userId: "u", domain: "INVESTMENT", name: "Index funds" },
  { id: "empty", userId: "u", domain: "INVESTMENT", name: "Nothing here" },
] as Category[];
const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };

describe("InvestmentValueList", () => {
  it("shows invested, latest value and gain per category, and opens or records on demand", () => {
    const onOpen = jest.fn();
    render(
      <InvestmentValueList categories={categories} ctx={ctx} currency="USD" onOpen={onOpen} />
    );

    const row = screen.getByRole("button", { name: /Index funds/ });
    expect(row).toHaveTextContent("Invested $130.00 · valued Sep 2");
    expect(screen.getByText("$260.00")).toBeInTheDocument();
    expect(screen.getByText("+100.0%")).toBeInTheDocument();
    expect(screen.queryByText("Nothing here")).toBeNull();

    fireEvent.click(row);
    expect(onOpen).toHaveBeenCalledWith("funds");

    fireEvent.click(screen.getByRole("button", { name: "Record value" }));
    expect(screen.getByTestId("record")).toHaveTextContent("funds");
  });
});

describe("valuationsInWindow", () => {
  it("keeps only the value checks dated inside the month", () => {
    const v = (id: string, date: Date) =>
      ({
        id,
        categoryId: "funds",
        asOf: ts(date),
        gainPct: 0,
        value: 0,
      }) as unknown as InvestmentValuation;
    const rows = valuationsInWindow(
      [v("a", new Date(2026, 8, 2)), v("b", new Date(2026, 7, 31)), v("c", new Date(2026, 9, 1))],
      new Date(2026, 8, 1),
      new Date(2026, 9, 1)
    );
    expect(rows.map((r) => r.id)).toEqual(["a"]);
  });
});
