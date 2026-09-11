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
});
