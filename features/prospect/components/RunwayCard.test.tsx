import { render, screen } from "@testing-library/react";
import { DEFAULT_PREFERENCES, PreferencesContext } from "../../../hooks/usePreferences";
import { RunwayCard } from "./RunwayCard";
import { ProspectModeToggle } from "./ProspectModeToggle";

const budget = {
  essentialMonthly: 1_000,
  debtMonthly: 200,
  burnMonthly: 1_200,
  pausedSpending: 300,
  pausedContributions: 100,
  fullMonthly: 1_600,
};

const card = (runway: number | null) => (
  <RunwayCard
    runway={runway}
    budget={budget}
    savings={6_000}
    investments={0}
    includeInvestments={false}
    benefitMonthly={500}
    benefitMonths={3}
    severance={0}
    currency="USD"
  />
);

const inSpanish = (ui: React.ReactElement) =>
  render(
    <PreferencesContext.Provider value={{ ...DEFAULT_PREFERENCES, language: "es" }}>
      {ui}
    </PreferencesContext.Provider>
  );

describe("RunwayCard in Spanish", () => {
  it("reads the runway with real plurals", () => {
    inSpanish(card(62));
    expect(screen.getByText("Colchón de emergencia")).toBeInTheDocument();
    expect(screen.getByText("5 años y 2 meses")).toBeInTheDocument();
    expect(screen.getByText("Sólido")).toBeInTheDocument();
    expect(screen.getByText("Subsidio × 3 meses")).toBeInTheDocument();
    expect(screen.getByText(/de lo esencial cubierto, hasta cerca de/)).toBeInTheDocument();
  });

  it("caps the figure past the simulation", () => {
    inSpanish(card(null));
    expect(screen.getByText("10+ años")).toBeInTheDocument();
    expect(screen.getByText("Cubierto")).toBeInTheDocument();
  });

  it("names the emergency switch", () => {
    inSpanish(<ProspectModeToggle mode="whatif" onChange={() => {}} />);
    expect(screen.getByRole("switch", { name: "Modo emergencia" })).toBeInTheDocument();
  });
});
