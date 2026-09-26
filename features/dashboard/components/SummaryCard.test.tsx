import { render, screen } from "@testing-library/react";
import { SummaryCard } from "./SummaryCard";
import { Circle, TrendingUp } from "../../../components/atoms/Icons";

describe("SummaryCard", () => {
  it("shows the title, the verdict, the figure and what it is made of", () => {
    render(
      <SummaryCard
        title="Monthly plan"
        badge={{ label: "On plan", tone: "success" }}
        figure={<span>$1,382.95</span>}
        sub="left to allocate each month"
        stats={[
          {
            key: "a",
            label: "Investments",
            domain: "INVESTMENT",
            Icon: TrendingUp,
            value: "$621.70",
          },
          { key: "b", label: "Savings", domain: "SAVING", Icon: Circle, value: "$617.39" },
        ]}
        footer={<div data-testid="bar" />}
        note="A caveat"
      />
    );
    expect(screen.getByText("Monthly plan")).toBeInTheDocument();
    expect(screen.getByText("On plan")).toBeInTheDocument();
    expect(screen.getByText("$1,382.95")).toBeInTheDocument();
    expect(screen.getByText("left to allocate each month")).toBeInTheDocument();
    const breakdown = screen.getByRole("list", { name: "Monthly plan breakdown" });
    expect(breakdown.children).toHaveLength(2);
    expect(screen.getByText("$621.70")).toBeInTheDocument();
    expect(screen.getByText("Savings")).toBeInTheDocument();
    expect(screen.getByTestId("bar")).toBeInTheDocument();
    expect(screen.getByText("A caveat")).toBeInTheDocument();
  });

  it("drops the breakdown panel, footer included, when there are no stats", () => {
    render(
      <SummaryCard
        title="Net worth"
        badge={{ label: "Today", tone: "info" }}
        sub="Nothing to value yet"
        footer={<div data-testid="bar" />}
      />
    );
    expect(screen.getByText("Nothing to value yet")).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByTestId("bar")).toBeNull();
  });
});
