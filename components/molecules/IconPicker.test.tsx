import { fireEvent, render, screen } from "@testing-library/react";
import { IconPicker } from "./IconPicker";
import { ICON_KEYS } from "../../constants";

describe("IconPicker", () => {
  it("offers every curated icon and marks the current one", () => {
    render(<IconPicker value="home" onChange={jest.fn()} />);
    expect(screen.getAllByRole("radio")).toHaveLength(ICON_KEYS.length);
    expect(screen.getByRole("radio", { name: "home" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "plane" })).toHaveAttribute("aria-checked", "false");
  });

  it("reports a pick", () => {
    const onChange = jest.fn();
    render(<IconPicker onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "plane" }));
    expect(onChange).toHaveBeenCalledWith("plane");
  });
});
