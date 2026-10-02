import { render, screen } from "@testing-library/react";
import { StackTooltip } from "./StackTooltip";
import type { CashFlowGroup, GroupedBar } from "../../features/dashboard/helpers/cashFlowSeries";

const GROUPS: CashFlowGroup[] = [
  {
    key: "INCOME",
    label: "Income",
    color: "green",
    series: [{ key: "salary", label: "Salary", color: "g1" }],
  },
  {
    key: "EXPENSE",
    label: "Expenses",
    color: "red",
    series: [
      { key: "home", label: "Home", color: "r1" },
      { key: "food", label: "Food", color: "r2" },
      { key: "fun", label: "Fun", color: "r3" },
    ],
  },
];

const AUG: GroupedBar = {
  key: "2026-08",
  label: "Aug",
  "INCOME:salary": 4800,
  "EXPENSE:home": 1950,
  "EXPENSE:food": 400,
  "EXPENSE:fun": 0,
};

describe("StackTooltip", () => {
  it("lists only the hovered bar's series, largest first, with their total", () => {
    render(
      <StackTooltip
        active
        payload={[{ dataKey: "EXPENSE:food", payload: AUG }]}
        groups={GROUPS}
        currency="USD"
      />
    );
    expect(screen.getByText("Expenses")).toBeInTheDocument();
    expect(screen.getByText("Aug")).toBeInTheDocument();
    expect(screen.queryByText("Salary")).toBeNull();
    expect(screen.queryByText("Fun")).toBeNull();
    const names = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(names[0]).toContain("Home");
    expect(names[1]).toContain("Food");
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("$2,350.00")).toBeInTheDocument();
  });

  it("renders nothing when no bar is hovered", () => {
    const { container } = render(<StackTooltip payload={[]} groups={GROUPS} currency="USD" />);
    expect(container).toBeEmptyDOMElement();
  });
});
