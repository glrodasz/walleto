import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ScenarioPicker } from "./ScenarioPicker";

const openMenu = () =>
  fireEvent.click(screen.getByRole("button", { name: "Variable expenses count at Worst" }));

describe("ScenarioPicker", () => {
  it("names the saved pick on the pill", () => {
    render(<ScenarioPicker value="top" onChange={jest.fn()} />);
    expect(
      screen.getByRole("button", { name: "Variable expenses count at Worst" })
    ).toHaveTextContent("Worst");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("offers Best / Average / Worst with the saved one checked, and says what they mean", () => {
    render(<ScenarioPicker value="top" onChange={jest.fn()} />);
    openMenu();
    expect(screen.getByRole("menu", { name: "Variable expenses count at" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "Worst" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("menuitemradio", { name: "Best" })).toHaveAttribute(
      "aria-checked",
      "false"
    );
    expect(screen.getByText(/Best uses the low end/)).toBeInTheDocument();
  });

  it("shows the pick at once, saves it and closes", () => {
    const onChange = jest.fn().mockResolvedValue(undefined);
    render(<ScenarioPicker value="top" onChange={onChange} />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Best" }));
    expect(onChange).toHaveBeenCalledWith("floor");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Variable expenses count at Best" })
    ).toBeInTheDocument();
  });

  it("does not save the pick it already has", () => {
    const onChange = jest.fn();
    render(<ScenarioPicker value="top" onChange={onChange} />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Worst" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("goes back to the saved one when saving fails", async () => {
    const onChange = jest.fn().mockRejectedValue(new Error("offline"));
    render(<ScenarioPicker value="top" onChange={onChange} />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Average" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Variable expenses count at Worst" })
      ).toBeInTheDocument()
    );
  });

  it("closes on Escape", () => {
    render(<ScenarioPicker value="top" onChange={jest.fn()} />);
    openMenu();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("hands Tab back to the browser from the pill, so Shift+Tab goes backwards", () => {
    render(<ScenarioPicker value="top" onChange={jest.fn()} />);
    openMenu();
    const option = screen.getByRole("menuitemradio", { name: "Best" });
    const notPrevented = fireEvent.keyDown(option, { key: "Tab", shiftKey: true });
    expect(notPrevented).toBe(true);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Variable expenses count at Worst" })).toHaveFocus();
  });

  it("stays open while the menu scrolls itself, and closes when the page does", () => {
    render(<ScenarioPicker value="top" onChange={jest.fn()} />);
    openMenu();
    fireEvent.scroll(screen.getByRole("menu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.scroll(document);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
