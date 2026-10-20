import { fireEvent, render, screen } from "@testing-library/react";
import { CheckboxField } from "./CheckboxField";

describe("CheckboxField", () => {
  it("names the box with its label and puts the hint and tag under it", () => {
    render(
      <CheckboxField
        label="Essential"
        hint="Keep paying it in emergency mode."
        tag={<span>Guessed</span>}
        checked={false}
        onChange={jest.fn()}
      />
    );
    const box = screen.getByRole("checkbox", { name: /Essential/ });
    expect(box.closest("label")).toHaveTextContent("Keep paying it in emergency mode.");
    expect(box.closest("label")).toHaveTextContent("Guessed");
  });

  it("keeps background behind an info icon that doesn't tick the box", () => {
    const onChange = jest.fn();
    render(
      <CheckboxField
        label="Spread monthly"
        info="The graph counts a twelfth each month."
        checked={false}
        onChange={onChange}
      />
    );
    const tip = screen.getByRole("button", { name: "More information" });
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent(
      "The graph counts a twelfth each month."
    );
    fireEvent.click(tip);
    expect(tip).toHaveAttribute("aria-expanded", "true");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reports the new state", () => {
    const onChange = jest.fn();
    render(<CheckboxField label="Show hidden" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Show hidden" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("disables the box itself", () => {
    render(<CheckboxField label="Locked" checked onChange={jest.fn()} disabled />);
    expect(screen.getByRole("checkbox", { name: "Locked" })).toBeDisabled();
  });
});
