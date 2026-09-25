import { fireEvent, render, screen } from "@testing-library/react";
import { AccountValueList } from "./AccountValueList";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type { Category, Currency } from "../../../types";

const ts = (date: Date) => ({ seconds: 0, nanoseconds: 0, toDate: () => date });

const panelMock = jest.fn((_props: unknown) => null);
jest.mock("./InvestmentValuePanel", () => ({
  InvestmentValuePanel: (props: unknown) => panelMock(props),
}));
const valuationModalMock = jest.fn((_props: unknown) => null);
jest.mock("./ValuationModal", () => ({
  ValuationModal: (props: unknown) => valuationModalMock(props),
}));
jest.mock("../../../hooks/useAccounts", () => ({
  useAccounts: () => ({
    accounts: [
      {
        id: "seb",
        userId: "u",
        domain: "SAVING",
        name: "SEB savings",
        provider: "SEB",
        currency: "USD",
        interestRate: { value: 2.5, period: "YEARLY" },
      },
      { id: "empty", userId: "u", domain: "SAVING", name: "Trip fund", currency: "USD" },
    ],
    loading: false,
    error: null,
  }),
}));
jest.mock("../../../hooks/useDomainTransactions", () => ({
  useDomainTransactions: () => ({
    transactions: [
      {
        id: "t1",
        userId: "u",
        domain: "SAVING",
        categoryId: "emergency",
        accountId: "seb",
        name: "Transfer",
        amount: 1000,
        currency: "USD",
        status: "PAID",
        occurredAt: ts(new Date(2026, 0, 10)),
      },
      {
        id: "t2",
        userId: "u",
        domain: "SAVING",
        categoryId: "emergency",
        name: "Old transfer",
        amount: 130,
        currency: "USD",
        status: "PAID",
        occurredAt: ts(new Date(2025, 0, 10)),
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
        categoryId: "emergency",
        asOf: ts(new Date(2026, 8, 2)),
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
  { id: "emergency", userId: "u", domain: "SAVING", name: "Emergency" },
  { id: "nothing", userId: "u", domain: "SAVING", name: "Nothing here" },
] as Category[];
const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };

beforeEach(() => {
  panelMock.mockClear();
  valuationModalMock.mockClear();
});

describe("AccountValueList", () => {
  it("lists every pocket plus the No-pocket bucket, opens a panel and records", () => {
    render(<AccountValueList domain="SAVING" categories={categories} ctx={ctx} currency="USD" />);

    const seb = screen.getByRole("button", { name: /SEB savings/ });
    expect(seb).toHaveTextContent("2.5% yearly");
    expect(seb).toHaveTextContent("SEB · In $1,000.00 · estimated");
    // Interest estimate: above the $1,000 that went in.
    const amounts = screen.getAllByText(/^\$1,0\d\d\.\d\d$/);
    expect(amounts.length).toBeGreaterThan(0);

    // The pre-account valuation on the "Emergency" savings category lands in the bucket.
    const bucket = screen.getByRole("button", { name: /No pocket/ });
    expect(bucket).toHaveTextContent("In $130.00 · checked Sep 2");
    expect(screen.getByText("$260.00")).toBeInTheDocument();
    expect(screen.getByText("+100.0%")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Trip fund/ })).toBeInTheDocument();
    expect(screen.queryByText("Nothing here")).toBeNull();

    fireEvent.click(seb);
    expect(panelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: { accountId: "seb" },
        title: "SEB savings",
        rate: { value: 2.5, period: "YEARLY" },
      })
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Update value" })[1]);
    expect(valuationModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ selector: { domain: "SAVING" }, costBasis: 130, domain: "SAVING" })
    );
  });

  it("reads a debt as repaid and owed, with a dash until a balance is recorded", () => {
    render(<AccountValueList domain="DEBT" categories={categories} ctx={ctx} currency="USD" />);
    expect(screen.getByText("Balances")).toBeInTheDocument();

    // The mocked rows count as repayments, but with no balance recorded the
    // debt reads as unknown — never as $0.00 owed, and never estimated.
    const seb = screen.getByRole("button", { name: /SEB savings/ });
    expect(seb).toHaveTextContent("SEB · Repaid (net) $1,000.00 · no balance yet");
    expect(seb).not.toHaveTextContent("estimated");
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.queryByText(/\+\d+\.\d%/)).toBeNull();
    expect(screen.queryByRole("button", { name: /No pocket|No debt/ })).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "Update balance" })[0]);
    expect(valuationModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ domain: "DEBT", latestValue: undefined })
    );
    fireEvent.click(seb);
    expect(panelMock).toHaveBeenCalledWith(expect.objectContaining({ domain: "DEBT" }));
  });
});
