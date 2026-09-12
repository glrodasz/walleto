import { computeListPosition } from "./computeListPosition";
import type { AnchorRect, ViewportBox } from "./computeListPosition";

// A roomy desktop-ish viewport with no visual-viewport offset.
const VIEWPORT: ViewportBox = {
  width: 900,
  height: 800,
  offsetTop: 0,
  offsetLeft: 0,
  layoutHeight: 800,
};

const ANCHOR: AnchorRect = { top: 100, bottom: 134, left: 40, width: 200 };

describe("computeListPosition", () => {
  it("opens below the anchor when there is room", () => {
    const pos = computeListPosition(ANCHOR, VIEWPORT);
    expect(pos.placement).toBe("below");
    // gap defaults to 6.
    expect(pos).toMatchObject({ top: 140 });
    expect(pos.maxHeight).toBe(320);
  });

  it("clamps the height to the room actually left below", () => {
    // 400 - 8 (margin) - (134 + 6) = 252 left below.
    const pos = computeListPosition(ANCHOR, { ...VIEWPORT, height: 400, layoutHeight: 400 });
    expect(pos.placement).toBe("below");
    expect(pos.maxHeight).toBe(252);
  });

  it("gives up exactly the bottom inset to fixed chrome", () => {
    const without = computeListPosition(ANCHOR, { ...VIEWPORT, height: 400, layoutHeight: 400 });
    const withBar = computeListPosition(
      ANCHOR,
      { ...VIEWPORT, height: 400, layoutHeight: 400 },
      { bottomInset: 68 }
    );
    expect(withBar.maxHeight).toBe(without.maxHeight - 68);
  });

  it("flips above when below is cramped and above is roomier", () => {
    // The onboarding case: an input low on the page with the keyboard up.
    const low: AnchorRect = { top: 500, bottom: 534, left: 40, width: 200 };
    const keyboard: ViewportBox = {
      width: 390,
      height: 600,
      offsetTop: 0,
      offsetLeft: 0,
      layoutHeight: 844,
    };
    const pos = computeListPosition(low, keyboard, { bottomInset: 68 });
    expect(pos.placement).toBe("above");
    // Anchored by its bottom, against the layout viewport.
    expect(pos).toMatchObject({ bottom: 844 - (500 - 6) });
    expect(pos).not.toHaveProperty("top");
    // 500 - 6 - 8 = 486 above, capped at the 320 ceiling.
    expect(pos.maxHeight).toBe(320);
  });

  it("does not flip when below is cramped but above is worse", () => {
    // Input near the very top: flipping would be strictly smaller.
    const high: AnchorRect = { top: 20, bottom: 54, left: 40, width: 200 };
    const pos = computeListPosition(high, { ...VIEWPORT, height: 160, layoutHeight: 160 });
    expect(pos.placement).toBe("below");
  });

  it("is at least the minimum width, and never wider than the viewport", () => {
    const narrowAnchor = computeListPosition(ANCHOR, VIEWPORT);
    expect(narrowAnchor.width).toBe(240);

    const phone = computeListPosition(
      { ...ANCHOR, left: 8, width: 120 },
      { ...VIEWPORT, width: 320 }
    );
    // 320 - 2 * 8 margin = 304 usable, so 240 still fits.
    expect(phone.width).toBe(240);

    const tiny = computeListPosition(
      { ...ANCHOR, left: 8, width: 120 },
      { ...VIEWPORT, width: 200 }
    );
    expect(tiny.width).toBe(184);
  });

  it("slides back inside both viewport edges", () => {
    const offLeft = computeListPosition({ ...ANCHOR, left: 2 }, VIEWPORT);
    expect(offLeft.left).toBe(8);

    // A right-aligned chip whose 240px list would run off the right edge.
    const offRight = computeListPosition(
      { ...ANCHOR, left: 300, width: 100 },
      { ...VIEWPORT, width: 390 }
    );
    expect(offRight.left).toBe(390 - 8 - 240);
  });

  it("respects a shifted visual viewport", () => {
    // iOS pinch-zoom / keyboard: the visible slice starts 120px down and is
    // only 260px tall, so the anchor at 200 still has room *below* it. Ignore
    // the offset and the same numbers say the opposite — flip, 96px tall.
    const shifted: ViewportBox = {
      width: 390,
      height: 260,
      offsetTop: 120,
      offsetLeft: 10,
      layoutHeight: 844,
    };
    const pos = computeListPosition({ top: 200, bottom: 234, left: 0, width: 200 }, shifted);
    expect(pos.placement).toBe("below");
    // 120 + 260 - 8 - (234 + 6) = 132.
    expect(pos.maxHeight).toBe(132);
    // Clamped to the shifted left edge.
    expect(pos.left).toBe(18);
  });

  it("never collapses below the minimum height", () => {
    // A hopeless viewport: no real room in either direction.
    const pos = computeListPosition(
      { top: 40, bottom: 74, left: 40, width: 200 },
      { ...VIEWPORT, height: 90, layoutHeight: 90 }
    );
    expect(pos.maxHeight).toBe(96);
  });
});
