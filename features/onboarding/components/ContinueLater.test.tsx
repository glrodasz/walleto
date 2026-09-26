import { fireEvent, render, screen } from "@testing-library/react";
import { ContinueLater } from "./ContinueLater";

describe("ContinueLater", () => {
  it("skips on the first step", () => {
    render(<ContinueLater step={1} onClick={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeInTheDocument();
  });

  it.each([2, 3, 4])("continues later on step %i", (step) => {
    render(<ContinueLater step={step} onClick={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Continue later" })).toBeInTheDocument();
  });

  it("says where to pick setup back up", () => {
    render(<ContinueLater step={2} onClick={jest.fn()} />);
    expect(
      screen.getByRole("button", { name: "How to finish setup later" })
    ).toHaveAccessibleDescription(/Settings\s›\sSetup/);
  });

  it("reports a click and is disabled while busy", () => {
    const onClick = jest.fn();
    const { rerender } = render(<ContinueLater step={2} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Continue later" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<ContinueLater step={2} onClick={onClick} busy />);
    expect(screen.getByRole("button", { name: "Continue later" })).toBeDisabled();
  });
});
