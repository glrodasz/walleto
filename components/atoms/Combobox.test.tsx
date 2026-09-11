import { render, screen, fireEvent } from "@testing-library/react";
import { Combobox } from "./Combobox";

const SUGGESTIONS = ["Salary", "Rent", "Pension", "Side projects"];

function setup(overrides: Partial<React.ComponentProps<typeof Combobox>> = {}) {
  const onSelect = jest.fn();
  const onCancel = jest.fn();
  render(
    <Combobox
      label="New Incomes category"
      suggestions={SUGGESTIONS}
      onSelect={onSelect}
      onCancel={onCancel}
      {...overrides}
    />
  );
  return { onSelect, onCancel, input: screen.getByRole("combobox") };
}

describe("Combobox", () => {
  it("lists all suggestions before anything is typed", () => {
    setup();
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(SUGGESTIONS);
  });

  it("filters case-insensitively as the user types", () => {
    const { input } = setup();
    fireEvent.change(input, { target: { value: "en" } });
    // "Rent" and "Pension" both contain "en". A create row still trails the
    // matches, since "en" is not itself an existing category name.
    const labels = screen.getAllByRole("option").map((o) => o.textContent);
    expect(labels.slice(0, 2)).toEqual(["Rent", "Pension"]);
    expect(labels[2]).toContain("Create");
  });

  it("offers a create row when nothing matches", () => {
    const { input } = setup();
    fireEvent.change(input, { target: { value: "Royalties" } });
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0].textContent).toContain("Royalties");
    expect(options[0].textContent).toContain("Create");
  });

  it("does not offer to create an exact duplicate of a suggestion", () => {
    const { input } = setup();
    fireEvent.change(input, { target: { value: "salary" } });
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0].textContent).toBe("Salary");
  });

  it("commits the highlighted suggestion on Enter", () => {
    const { input, onSelect } = setup();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("Rent");
  });

  it("commits the typed value when creating", () => {
    const { input, onSelect } = setup();
    fireEvent.change(input, { target: { value: "Royalties" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("Royalties");
  });

  it("commits on click", () => {
    const { onSelect } = setup();
    fireEvent.mouseDown(screen.getByText("Pension"));
    expect(onSelect).toHaveBeenCalledWith("Pension");
  });

  it("cancels on Escape without selecting", () => {
    const { input, onSelect, onCancel } = setup();
    fireEvent.change(input, { target: { value: "Royalties" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("wraps the highlight around the ends of the list", () => {
    const { input, onSelect } = setup();
    // Up from the first option wraps to the last.
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("Side projects");
  });

  it("shows nothing to pick when suggestions are exhausted and input is empty", () => {
    setup({ suggestions: [] });
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
});
