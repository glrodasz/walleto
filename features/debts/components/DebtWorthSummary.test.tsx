import { render, screen } from "@testing-library/react";
import type { Account, InvestmentValuation, Timestamp, Transaction } from "../../../types";

const ts = (date: Date): Timestamp => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
});

// SEB loan from #118: 606,673 checked Oct 5 at 2.85%, 2,504 paid Oct 28.
const accounts: Account[] = [
  {
    id: "loan",
    userId: "u1",
    domain: "DEBT",
    name: "48388280",
    currency: "SEK",
    interestRate: { value: 2.85, period: "YEARLY" },
  },
];
const transactions: Transaction[] = [
  {
    userId: "u1",
    domain: "DEBT",
    categoryId: "mortgage",
    accountId: "loan",
    name: "Instalment",
    amount: 2504,
    currency: "SEK",
    occurredAt: ts(new Date(2026, 9, 28, 12)),
    status: "PAID",
  },
];
const valuations = [
  {
    userId: "u1",
    domain: "DEBT",
    accountId: "loan",
    asOf: ts(new Date(2026, 9, 5, 12)),
    value: 606673,
    costBasis: 0,
    gainPct: 0,
    currency: "SEK",
  },
] as InvestmentValuation[];

jest.mock("../../investments/hooks/useDomainValue", () => ({
  useDomainValue: () => ({ accounts, transactions, valuations }),
}));

import { DebtWorthSummary } from "./DebtWorthSummary";
import { IDENTITY_RATES } from "../../../helpers/fx";

describe("DebtWorthSummary", () => {
  it("reads the Total with the Owed list's bank-style model, so the two agree", () => {
    render(
      <DebtWorthSummary
        categories={[]}
        ctx={{ rates: IDENTITY_RATES, target: "SEK" }}
        end={new Date(2026, 10, 6)}
        start={new Date(2026, 10, 1)}
        window={
          {
            key: "2026-11",
            start: new Date(2026, 10, 1),
            end: new Date(2026, 11, 1),
            longLabel: "November 2026",
            isCurrent: true,
          } as never
        }
        previousLabel="October 2026"
        currency="SEK"
        monthly={2504}
      />
    );
    // 606,673 + one month of interest (1,440.85) − 2,504, as SEB shows it.
    expect(screen.getAllByText(/605,609\.85/).length).toBeGreaterThan(0);
    expect(screen.getByText(/2,504\.00 a month/)).toBeInTheDocument();
  });
});
