import { fireEvent, render, screen } from "@testing-library/react";
import { MonthHeader } from "./MonthHeader";
import { monthWindows } from "../helpers/months";

const now = new Date(2026, 8, 6, 15);
const windows = monthWindows(3, now); // Jul, Aug, Sep

describe("MonthHeader", () => {
  it("describes the month in progress: so far, still planned, expected, and the average", () => {
    const onSelect = jest.fn();
    render(
      <MonthHeader
        domain="EXPENSE"
        windows={windows}
        selectedKey="2026-09"
        onSelect={onSelect}
        realized={3_237}
        expected={24_237}
        average={26_114}
        currency="USD"
      />
    );
    expect(screen.getByText("Spent in September so far")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sep", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "13");
    expect(screen.getByText("$21,000.00")).toBeInTheDocument();
    expect(screen.getByText("$24,237.00")).toBeInTheDocument();
    // expected 24,237 vs avg 26,114 → 7% below, good for expenses
    expect(screen.getByText("7% below")).toHaveClass("good");

    fireEvent.click(screen.getByRole("tab", { name: "Aug" }));
    expect(onSelect).toHaveBeenCalledWith("2026-08");
  });

  it("treats a finished month as a total and judges it against the average", () => {
    render(
      <MonthHeader
        domain="INCOME"
        windows={windows}
        selectedKey="2026-08"
        onSelect={jest.fn()}
        realized={57_650}
        expected={57_650}
        average={50_000}
        currency="USD"
      />
    );
    expect(screen.getByText("Received in August")).toBeInTheDocument();
    expect(screen.getByText("Month total", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("15% above")).toHaveClass("good");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("says when nothing more is planned and skips the average without history", () => {
    render(
      <MonthHeader
        domain="SAVING"
        windows={windows}
        selectedKey="2026-09"
        onSelect={jest.fn()}
        realized={500}
        expected={500}
        average={null}
        currency="USD"
      />
    );
    expect(screen.getByText("Nothing more planned this month")).toBeInTheDocument();
    expect(screen.queryByText(/your average/)).toBeNull();
  });
});
