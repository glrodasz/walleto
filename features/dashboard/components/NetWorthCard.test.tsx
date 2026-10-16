import { render, screen } from "@testing-library/react";
import { NetWorthCard } from "./NetWorthCard";
import type { NetWorth } from "../helpers/netWorth";
import { DEFAULT_PREFERENCES, PreferencesContext } from "../../../hooks/usePreferences";

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

  it("speaks Spanish inside a Spanish preference", () => {
    render(
      <PreferencesContext.Provider value={{ ...DEFAULT_PREFERENCES, language: "es" }}>
        <NetWorthCard
          worth={worth({ estimated: true, lastCheckedAt: new Date(2026, 8, 6) })}
          currency="USD"
        />
      </PreferencesContext.Provider>
    );
    expect(screen.getByText("Patrimonio")).toBeInTheDocument();
    expect(screen.getByText("Adeudado")).toBeInTheDocument();
    expect(
      screen.getByText("Lo que tienes menos lo que debes · revisado el 6 sept · en parte estimado")
    ).toBeInTheDocument();
  });
});
