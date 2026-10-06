import { fireEvent, render, screen } from "@testing-library/react";
import { MonthPicker } from "./MonthPicker";
import { monthWindows } from "../../features/domains/helpers/months";

const now = new Date(2026, 8, 11);
const windows = monthWindows(4, now); // Jun, Jul, Aug, Sep 2026
const twoYears = monthWindows(24, now); // Oct 2024 … Sep 2026

const trigger = () => screen.getByRole("button", { name: /^Month:/ });
const optionLabels = () => screen.getAllByRole("option").map((o) => o.textContent);

describe("MonthPicker", () => {
  it("offers the months newest first and reports a pick", () => {
    const onChange = jest.fn();
    render(<MonthPicker value="2026-09" windows={windows} onChange={onChange} />);
    expect(trigger()).toHaveAccessibleName("Month: September 2026");
    fireEvent.click(trigger());
    expect(screen.getByRole("listbox", { name: "Month" })).toBeInTheDocument();
    expect(optionLabels()).toEqual(["September 2026", "August 2026", "July 2026", "June 2026"]);
    expect(screen.getByRole("option", { name: "September 2026" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    fireEvent.click(screen.getByRole("option", { name: "July 2026" }));
    expect(onChange).toHaveBeenCalledWith("2026-07");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows the last six months, then twelve, then twenty-four", () => {
    render(<MonthPicker value="2026-09" windows={twoYears} onChange={jest.fn()} />);
    fireEvent.click(trigger());
    expect(optionLabels()).toHaveLength(6);
    expect(optionLabels()[5]).toBe("April 2026");

    fireEvent.click(screen.getByRole("button", { name: "Show last 12 months" }));
    expect(optionLabels()).toHaveLength(12);
    expect(optionLabels()[11]).toBe("October 2025");

    fireEvent.click(screen.getByRole("button", { name: "Show last 24 months" }));
    expect(optionLabels()).toHaveLength(24);
    expect(optionLabels()[23]).toBe("October 2024");
    expect(screen.queryByRole("button", { name: /^Show last/ })).not.toBeInTheDocument();
  });

  it("has no Show more when every month already fits", () => {
    render(<MonthPicker value="2026-09" windows={windows} onChange={jest.fn()} />);
    fireEvent.click(trigger());
    expect(screen.queryByRole("button", { name: /^Show last/ })).not.toBeInTheDocument();
  });

  it("opens at the step that contains the selected month", () => {
    render(<MonthPicker value="2025-12" windows={twoYears} onChange={jest.fn()} />);
    fireEvent.click(trigger());
    expect(optionLabels()).toHaveLength(12);
    expect(screen.getByRole("option", { name: "December 2025" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("option", { name: "December 2025" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Show last 24 months" })).toBeInTheDocument();
  });

  it("closes on Escape and hands focus back to the pill", () => {
    render(<MonthPicker value="2026-09" windows={twoYears} onChange={jest.fn()} />);
    fireEvent.click(trigger());
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it("walks the list with the arrow keys", () => {
    render(<MonthPicker value="2026-09" windows={twoYears} onChange={jest.fn()} />);
    fireEvent.keyDown(trigger(), { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: "September 2026" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: "August 2026" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "End" });
    expect(screen.getByRole("button", { name: "Show last 12 months" })).toHaveFocus();
  });

  it("writes the month as text, short on phones, with no down arrow", () => {
    const { container } = render(
      <MonthPicker value="2026-09" windows={windows} onChange={jest.fn()} />
    );
    expect(container.querySelector(".long")).toHaveTextContent("September 2026");
    expect(container.querySelector(".short")).toHaveTextContent("Sep 2026");
    expect(container.querySelector("svg.chevron, .chevron")).toBeNull();
  });

  it("steps with the arrows and stops at both ends", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <MonthPicker value="2026-09" windows={windows} onChange={onChange} />
    );
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(onChange).toHaveBeenCalledWith("2026-08");

    rerender(<MonthPicker value="2026-06" windows={windows} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next month" })).toBeEnabled();
  });

  it("prefers onStep when given", () => {
    const onStep = jest.fn();
    render(<MonthPicker value="2026-08" windows={windows} onChange={jest.fn()} onStep={onStep} />);
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(onStep).toHaveBeenCalledWith(1);
  });
});
