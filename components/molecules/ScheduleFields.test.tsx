import { render, screen, fireEvent } from "@testing-library/react";
import { ScheduleFields } from "./ScheduleFields";

const value = { dayOfMonth: 12, secondDayOfMonth: 27, month: 3, date: "2026-03-09" };

describe("ScheduleFields", () => {
  it("shows only a payment day for monthly items", () => {
    render(<ScheduleFields frequency="MONTHLY" value={value} onChange={jest.fn()} />);
    expect(screen.getByLabelText("Payment day")).toHaveValue("12");
    expect(screen.queryByLabelText("Month")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Date")).not.toBeInTheDocument();
  });

  it("shows month and day for yearly items", () => {
    render(<ScheduleFields frequency="YEARLY" value={value} onChange={jest.fn()} />);
    expect(screen.getByLabelText("Month")).toHaveValue("3");
    expect(screen.getByLabelText("Day")).toHaveValue("12");
  });

  it("shows a single date for one-time items", () => {
    render(<ScheduleFields frequency="ONE_TIME" value={value} onChange={jest.fn()} />);
    expect(screen.getByLabelText("Date")).toHaveValue("2026-03-09");
  });

  it("shows a start date for weekly items", () => {
    render(<ScheduleFields frequency="WEEKLY" value={value} onChange={jest.fn()} />);
    expect(screen.getByLabelText("Starts on")).toHaveValue("2026-03-09");
  });

  it("shows two payment days for twice-a-month items", () => {
    const onChange = jest.fn();
    render(<ScheduleFields frequency="BIWEEKLY" value={value} onChange={onChange} />);
    expect(screen.getByLabelText("First payment day")).toHaveValue("12");
    expect(screen.getByLabelText("Second payment day")).toHaveValue("27");
    fireEvent.change(screen.getByLabelText("Second payment day"), { target: { value: "15" } });
    expect(onChange).toHaveBeenCalledWith({ secondDayOfMonth: 15 });
  });

  it("shows the first month and the payment day for quarterly items", () => {
    render(<ScheduleFields frequency="QUARTERLY" value={value} onChange={jest.fn()} />);
    expect(screen.getByLabelText("First month")).toHaveValue("3");
    expect(screen.getByLabelText("Payment day")).toHaveValue("12");
  });

  it("reports changes as numbers for day and month", () => {
    const onChange = jest.fn();
    render(<ScheduleFields frequency="YEARLY" value={value} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Month"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Day"), { target: { value: "19" } });

    expect(onChange).toHaveBeenCalledWith({ month: 10 });
    expect(onChange).toHaveBeenCalledWith({ dayOfMonth: 19 });
  });
});
