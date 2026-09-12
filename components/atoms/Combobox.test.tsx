import { render, screen, fireEvent, act } from "@testing-library/react";
import { Combobox } from "./Combobox";

const SUGGESTIONS = ["Salary", "Rent", "Pension", "Side projects"];

function setup(overrides: Partial<React.ComponentProps<typeof Combobox>> = {}) {
  const onSelect = jest.fn();
  const onCancel = jest.fn();
  const view = render(
    <Combobox
      label="New Incomes category"
      suggestions={SUGGESTIONS}
      onSelect={onSelect}
      onCancel={onCancel}
      {...overrides}
    />
  );
  return { ...view, onSelect, onCancel, input: screen.getByRole("combobox") };
}

/**
 * jsdom has no layout, so every rect is zero and `visualViewport` does not
 * exist at all. Faking both is what makes the placement path testable here;
 * the arithmetic itself is covered in utils/computeListPosition.test.ts.
 */
function mockAnchor(rect: Partial<DOMRect>) {
  jest.spyOn(HTMLInputElement.prototype, "getBoundingClientRect").mockReturnValue({
    top: 100,
    bottom: 134,
    left: 16,
    right: 216,
    width: 200,
    height: 34,
    x: 16,
    y: 100,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect);
}

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: height, configurable: true });
  Object.defineProperty(document.documentElement, "clientHeight", {
    value: height,
    configurable: true,
  });
}

function fakeVisualViewport(box: { width: number; height: number; offsetTop?: number }) {
  const listeners: Record<string, (() => void)[]> = {};
  const vv = {
    ...box,
    offsetTop: box.offsetTop ?? 0,
    offsetLeft: 0,
    addEventListener: jest.fn((type: string, fn: () => void) => {
      (listeners[type] ??= []).push(fn);
    }),
    removeEventListener: jest.fn(),
    /** Drive a keyboard-style viewport change through the real listeners. */
    emit(type: string) {
      listeners[type]?.forEach((fn) => fn());
    },
  };
  Object.defineProperty(window, "visualViewport", { value: vv, configurable: true });
  return vv;
}

function listStyle() {
  return screen.getByRole("listbox").style;
}

describe("Combobox", () => {
  const originalRaf = window.requestAnimationFrame;

  beforeEach(() => {
    setViewport(390, 800);
    // Run frames synchronously so a measure lands before the assertion.
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }) as typeof window.requestAnimationFrame;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.requestAnimationFrame = originalRaf;
    // jsdom ships no visualViewport; put it back the way we found it.
    Reflect.deleteProperty(window, "visualViewport");
  });

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
  it("sizes and places the list from the room below the input", () => {
    mockAnchor({ top: 100, bottom: 134 });
    setup();
    // gap is 6, and 800 - 8 margin - 140 leaves far more than the 320 ceiling.
    expect(listStyle().top).toBe("140px");
    expect(listStyle().maxHeight).toBe("320px");
    expect(listStyle().width).toBe("240px");
  });

  it("flips above the input when it opens near the bottom of the screen", () => {
    // The reported bug: a section low on the page with the keyboard up.
    setViewport(390, 844);
    fakeVisualViewport({ width: 390, height: 400 });
    mockAnchor({ top: 330, bottom: 364 });
    setup();
    expect(listStyle().bottom).toBe(`${844 - (330 - 6)}px`);
    expect(listStyle().top).toBe("");
  });

  it("leaves room for a fixed bottom bar", () => {
    setViewport(390, 500);
    mockAnchor({ top: 100, bottom: 134 });
    const bar = document.createElement("div");
    bar.setAttribute("data-overlay-bottom-bar", "");
    document.body.append(bar);
    jest.spyOn(bar, "getBoundingClientRect").mockReturnValue({
      top: 432,
      bottom: 500,
      height: 68,
    } as DOMRect);
    bar.style.position = "fixed";

    setup();
    // 500 - 8 margin - 68 bar - 140 = 284, rather than the 352 without it.
    expect(listStyle().maxHeight).toBe("284px");
    bar.remove();
  });

  it("ignores a bottom bar that is back in the flow, as on desktop", () => {
    setViewport(1280, 460);
    mockAnchor({ top: 100, bottom: 134 });
    const footer = document.createElement("div");
    footer.setAttribute("data-overlay-bottom-bar", "");
    document.body.append(footer);
    jest.spyOn(footer, "getBoundingClientRect").mockReturnValue({
      top: 392,
      bottom: 460,
      height: 68,
    } as DOMRect);
    // No `position: fixed` — jsdom reports the default `static`.

    setup();
    // 460 - 8 margin - 140 = 312: the footer costs nothing. Were it counted,
    // this would be 244.
    expect(listStyle().maxHeight).toBe("312px");
    footer.remove();
  });

  it("tracks the visual viewport, which is all iOS reports when the keyboard opens", () => {
    const vv = fakeVisualViewport({ width: 390, height: 800 });
    mockAnchor({ top: 100, bottom: 134 });
    const { unmount } = setup();

    expect(vv.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(vv.addEventListener).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(listStyle().maxHeight).toBe("320px");

    // The keyboard slides up: the layout viewport never changes, only this.
    vv.height = 380;
    act(() => vv.emit("resize"));
    // 380 - 8 - 140 = 232.
    expect(listStyle().maxHeight).toBe("232px");

    unmount();
    expect(vv.removeEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(vv.removeEventListener).toHaveBeenCalledWith("scroll", expect.any(Function));
  });

  it("still places the list where there is no visualViewport at all", () => {
    mockAnchor({ top: 100, bottom: 134 });
    expect(() => setup()).not.toThrow();
    expect(listStyle().top).toBe("140px");
  });

  it("marks the create row so it can stay pinned in view", () => {
    const { input } = setup();
    fireEvent.change(input, { target: { value: "Royalties" } });
    expect(screen.getByRole("option")).toHaveClass("create");

    fireEvent.change(input, { target: { value: "Salary" } });
    expect(screen.getByRole("option")).not.toHaveClass("create");
  });
});
