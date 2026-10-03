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
