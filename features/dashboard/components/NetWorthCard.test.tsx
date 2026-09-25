import { render, screen } from "@testing-library/react";
import { NetWorthCard } from "./NetWorthCard";
import type { NetWorth } from "../helpers/netWorth";

const worth = (over: Partial<NetWorth> = {}): NetWorth => ({
  investments: 10_000,
  savings: 2_500,
  debts: 4_000,
  net: 8_500,
  debtsUnknown: false,
  estimated: false,
  empty: false,
  lastCheckedAt: null,
  ...over,
});

describe("NetWorthCard", () => {
  it("shows the position and what it is made of", () => {
    render(<NetWorthCard worth={worth()} currency="USD" />);
    expect(screen.getByText("Net worth")).toBeInTheDocument();
    expect(screen.getByText("$8,500.00")).toBeInTheDocument();
    expect(screen.getByText("$10,000.00")).toBeInTheDocument();
    expect(screen.getByText("$4,000.00")).toBeInTheDocument();
    expect(screen.getByText("Owed on debts")).toBeInTheDocument();
  });

  it("writes an unrecorded debt as a dash and explains it", () => {
    render(
      <NetWorthCard worth={worth({ debts: 0, net: 12_500, debtsUnknown: true })} currency="USD" />
    );
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText(/has no recorded balance yet/)).toBeInTheDocument();
  });

  it("invites the owner to value something when there is nothing yet", () => {
    render(<NetWorthCard worth={worth({ empty: true })} currency="USD" />);
    expect(screen.getByText(/to see where you stand/)).toBeInTheDocument();
    expect(screen.queryByText("Owed on debts")).not.toBeInTheDocument();
  });
});
