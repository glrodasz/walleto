import { fireEvent, render, screen } from "@testing-library/react";
import { TabStrip } from "./TabStrip";

describe("TabStrip", () => {
  it("marks the active tab and reports a click", () => {
    const onChange = jest.fn();
    render(
      <TabStrip
        label="Section"
        value="tags"
        onChange={onChange}
        tabs={[
          { key: "general", label: "General" },
          { key: "tags", label: "Tags" },
        ]}
      />
    );
    expect(screen.getByRole("tablist", { name: "Section" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tags" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "General" })).toHaveAttribute("aria-selected", "false");
    fireEvent.click(screen.getByRole("tab", { name: "General" }));
    expect(onChange).toHaveBeenCalledWith("general");
  });
});
