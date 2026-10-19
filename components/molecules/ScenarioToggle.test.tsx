import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ScenarioToggle } from "./ScenarioToggle";

describe("ScenarioToggle", () => {
  it("offers Best / Average / Worst with the saved one checked", () => {
    render(<ScenarioToggle value="top" onChange={jest.fn()} />);
    expect(screen.getByRole("radio", { name: "Worst" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Best" })).toHaveAttribute("aria-checked", "false");
  });

  it("shows the pick at once and saves it", () => {
    const onChange = jest.fn().mockResolvedValue(undefined);
    render(<ScenarioToggle value="top" onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "Best" }));
    expect(onChange).toHaveBeenCalledWith("floor");
    expect(screen.getByRole("radio", { name: "Best" })).toHaveAttribute("aria-checked", "true");
  });

  it("goes back to the saved one when saving fails", async () => {
    const onChange = jest.fn().mockRejectedValue(new Error("offline"));
    render(<ScenarioToggle value="top" onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "Average" }));
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "Worst" })).toHaveAttribute("aria-checked", "true")
    );
  });
});
