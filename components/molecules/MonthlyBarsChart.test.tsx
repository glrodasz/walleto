import { render, screen, within } from "@testing-library/react";
import { MonthlyBarsChart } from "./MonthlyBarsChart";

// recharts renders nothing measurable in jsdom; the accessible summary list
// carries the same numbers, so that is what the tests read.
const series = [{ key: "spent", label: "Spent", color: "red" }];

describe("MonthlyBarsChart", () => {
  it("lists every month with its amount, marks the month in progress and the planned segment", () => {
    render(
      <MonthlyBarsChart
        data={[
          { key: "2026-08", label: "Aug", spent: 24_000 },
          { key: "2026-09", label: "Sep", spent: 3_237, planned: 21_000, isCurrent: true },
        ]}
        series={series}
        currency="USD"
        loading={false}
        average={26_114}
      />
    );
    const list = screen.getByRole("list", { name: "Monthly totals" });
    const items = within(list).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Aug: Spent $24,000.00");
    expect(items[1]).toHaveTextContent(
      "Sep: Spent $3,237.00, still planned $21,000.00 (in progress)"
    );
    expect(screen.getByText("Still planned")).toBeInTheDocument();
    expect(screen.getByText(/Avg \$26\.1K/)).toBeInTheDocument();
  });

  it("shows the empty state only when nothing landed and nothing is planned", () => {
    const { rerender } = render(
      <MonthlyBarsChart
        data={[{ key: "2026-09", label: "Sep", spent: 0, isCurrent: true }]}
        series={series}
        currency="USD"
        loading={false}
      />
    );
    expect(screen.getByText("No transactions in this period")).toBeInTheDocument();

    rerender(
      <MonthlyBarsChart
        data={[{ key: "2026-09", label: "Sep", spent: 0, planned: 500, isCurrent: true }]}
        series={series}
        currency="USD"
        loading={false}
      />
    );
    expect(screen.queryByText("No transactions in this period")).toBeNull();
  });

  it("supports two series side by side without a planned legend", () => {
    render(
      <MonthlyBarsChart
        data={[{ key: "2026-08", label: "Aug", income: 60_000, expense: 24_000 }]}
        series={[
          { key: "income", label: "Income", color: "green" },
          { key: "expense", label: "Expenses", color: "red" },
        ]}
        currency="SEK"
        loading={false}
      />
    );
    expect(screen.getByRole("listitem")).toHaveTextContent(
      /Income SEK 60,000\.00, Expenses SEK 24,000\.00/
    );
    expect(screen.queryByText("Still planned")).toBeNull();
  });
});
