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

  it("can use a tag as its trigger, and a tap on it never toggles a surrounding label", () => {
    const onChange = jest.fn();
    render(
      <label>
        <input type="checkbox" onChange={onChange} />
        Essential
        <InfoTip label="Guessed: why?" trigger={<span>Guessed</span>}>
          Picked from the category.
        </InfoTip>
      </label>
    );
    const trigger = screen.getByRole("button", { name: "Guessed: why?" });
    expect(trigger).toHaveTextContent("Guessed");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("InfoTip near the right edge", () => {
  const rect = Element.prototype.getBoundingClientRect;
  afterEach(() => {
    Element.prototype.getBoundingClientRect = rect;
  });

  it("keeps the bubble inside the layout width when it opens, even when the window reads wider", () => {
    // A phone whose page already spilled over: innerWidth grew, the layout didn't.
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 616 });
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      value: 390,
    });
    Element.prototype.getBoundingClientRect = function () {
      return { left: 338, right: 618, top: 0, bottom: 0, width: 280, height: 0 } as DOMRect;
    };
    render(<InfoTip label="About scenarios">Best uses the low end.</InfoTip>);
    fireEvent.click(screen.getByRole("button", { name: "About scenarios" }));
    const bubble = screen.getByText("Best uses the low end.").closest(".bubble") as HTMLElement;
    expect(bubble.style.transform).toBe("translateX(-236px)");
  });

  it("measures nothing while closed: a hidden bubble has no box", () => {
    Element.prototype.getBoundingClientRect = function () {
      return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 } as DOMRect;
    };
    render(<InfoTip label="About scenarios">Best uses the low end.</InfoTip>);
    window.dispatchEvent(new Event("resize"));
    const bubble = screen.getByText("Best uses the low end.").closest(".bubble") as HTMLElement;
    expect(bubble.style.transform).toBe("");
  });
});
