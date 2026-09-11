import { fireEvent, render, screen } from "@testing-library/react";
import { MonthPicker } from "./MonthPicker";
import { monthWindows } from "../../features/domains/helpers/months";

const now = new Date(2026, 8, 11);
const windows = monthWindows(4, now); // Jun, Jul, Aug, Sep 2026

describe("MonthPicker", () => {
  it("offers the months newest first and reports a pick", () => {
    const onChange = jest.fn();
    render(<MonthPicker value="2026-09" windows={windows} onChange={onChange} />);
    const select = screen.getByRole("combobox", { name: "Month" }) as HTMLSelectElement;
    expect(select.value).toBe("2026-09");
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual([
      "September 2026",
      "August 2026",
      "July 2026",
      "June 2026",
    ]);
    fireEvent.change(select, { target: { value: "2026-07" } });
    expect(onChange).toHaveBeenCalledWith("2026-07");
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
