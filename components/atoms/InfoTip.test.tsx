import { fireEvent, render, screen } from "@testing-library/react";
import { InfoTip } from "./InfoTip";

function renderTip() {
  render(
    <div>
      <InfoTip label="How to finish setup later">Run setup again from Settings.</InfoTip>
      <button type="button">Elsewhere</button>
    </div>
  );
  return screen.getByRole("button", { name: "How to finish setup later" });
}

describe("InfoTip", () => {
  it("describes its trigger with the tooltip text", () => {
    const trigger = renderTip();
    const tip = screen.getByRole("tooltip", { hidden: true });
    expect(tip).toHaveTextContent("Run setup again from Settings.");
    expect(trigger).toHaveAttribute("aria-describedby", tip.id);
    expect(trigger).toHaveAccessibleDescription("Run setup again from Settings.");
  });

  it("toggles open on tap", () => {
    const trigger = renderTip();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape", () => {
    const trigger = renderTip();
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on a tap outside, not on one inside", () => {
    const trigger = renderTip();
    fireEvent.click(trigger);
    fireEvent.pointerDown(screen.getByRole("tooltip", { hidden: true }));
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerDown(screen.getByRole("button", { name: "Elsewhere" }));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
