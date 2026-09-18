import { render, screen } from "@testing-library/react";
import { MonthSummary } from "./MonthSummary";
import { monthWindows } from "../helpers/months";

const now = new Date(2026, 8, 6, 15);
const [aug, sep] = monthWindows(2, now);

describe("MonthSummary", () => {
  it("describes the month in progress against last month and the plan", () => {
    render(
      <MonthSummary
        domain="EXPENSE"
        window={sep}
        realized={18_432.96}
        expected={23_794.41}
        delta={{ current: 18_432.96, previous: 16_402.18, deltaPct: 12.4, previousKey: aug.key }}
        previousLabel={aug.longLabel}
        currency="USD"
      />
    );
    expect(screen.getByText("Total spent so far")).toBeInTheDocument();
    expect(screen.getByText("Compared to $16,402.18 in August 2026")).toBeInTheDocument();
    // spending 12% more is bad news for expenses
    expect(screen.getByLabelText("Up 12%")).toHaveClass("bad");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "77");
    expect(screen.getByText("77%")).toBeInTheDocument();
    expect(screen.getByText("$5,361.45 left")).toBeInTheDocument();
    // A domain without accounts never carries the breakdown line.
    expect(screen.queryByText(/contributed/)).not.toBeInTheDocument();
  });

  it("treats a finished month as a total and copes without history", () => {
    render(
      <MonthSummary
        domain="INCOME"
        window={aug}
        realized={57_650}
        expected={57_650}
        delta={{ current: 57_650, previous: 0, deltaPct: null, previousKey: null }}
        previousLabel={null}
        currency="USD"
      />
    );
    expect(screen.getByText("Total received")).toBeInTheDocument();
    expect(screen.getByText("No previous month to compare with")).toBeInTheDocument();
    expect(screen.getByText("Month total")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  const investments = (gain: number | undefined, contributed = 5_000) => (
    <MonthSummary
      domain="INVESTMENT"
      window={sep}
      realized={contributed + (gain ?? 0)}
      expected={contributed + (gain ?? 0)}
      delta={{ current: 0, previous: 0, deltaPct: null, previousKey: null }}
      previousLabel={null}
      currency="USD"
      contributed={contributed}
      gain={gain}
    />
  );

  it("says what an investment month is made of", () => {
    render(investments(3_100));
    expect(screen.getByText("$5,000.00 contributed · $3,100.00 gain")).toBeInTheDocument();
  });

  it("calls a negative month a loss instead of printing a minus gain", () => {
    render(investments(-1_200));
    expect(screen.getByText("$5,000.00 contributed · $1,200.00 loss")).toBeInTheDocument();
  });

  it("stays quiet in a month with no value check", () => {
    render(investments(0));
    expect(screen.queryByText(/contributed/)).not.toBeInTheDocument();
  });
});
