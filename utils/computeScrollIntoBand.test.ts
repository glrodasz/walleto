import { computeScrollIntoBand } from "./computeScrollIntoBand";
import type { ViewportBox } from "./computeListPosition";

const VIEWPORT: ViewportBox = {
  width: 390,
  height: 800,
  offsetTop: 0,
  offsetLeft: 0,
  layoutHeight: 800,
};

describe("computeScrollIntoBand", () => {
  it("does not move a field that already fits", () => {
    expect(computeScrollIntoBand({ top: 100, bottom: 134 }, VIEWPORT)).toBe(0);
  });

  it("scrolls down by exactly what is hanging below the band", () => {
    // The keyboard case: 800 -> 400 visible, band ends at 392.
    const keyboard = { ...VIEWPORT, height: 400 };
    expect(computeScrollIntoBand({ top: 700, bottom: 734 }, keyboard)).toBe(342);
  });

  it("scrolls up for a field above the band", () => {
    expect(computeScrollIntoBand({ top: 2, bottom: 36 }, VIEWPORT)).toBe(-6);
  });

  it("gives up the bottom inset to fixed chrome", () => {
    const keyboard = { ...VIEWPORT, height: 400 };
    const without = computeScrollIntoBand({ top: 700, bottom: 734 }, keyboard);
    const withBar = computeScrollIntoBand({ top: 700, bottom: 734 }, keyboard, { bottomInset: 72 });
    expect(withBar - without).toBe(72);
  });

  it("follows a shifted visual viewport", () => {
    // iOS pinch/keyboard: the visible slice starts 200px down.
    const shifted = { ...VIEWPORT, height: 800, offsetTop: 200 };
    // Above the band, which now starts at 208.
    expect(computeScrollIntoBand({ top: 120, bottom: 154 }, shifted)).toBe(-88);
    // And the band now ends at 200 + 800 - 8 = 992, so this one fits.
    expect(computeScrollIntoBand({ top: 900, bottom: 934 }, shifted)).toBe(0);
  });

  it("aligns the top of a field taller than the band", () => {
    const tiny = { ...VIEWPORT, height: 60 };
    // Band is 60 - 16 = 44 tall; the field is 100.
    expect(computeScrollIntoBand({ top: 30, bottom: 130 }, tiny)).toBe(22);
  });

  it("respects a custom margin", () => {
    const keyboard = { ...VIEWPORT, height: 400 };
    expect(computeScrollIntoBand({ top: 700, bottom: 734 }, keyboard, { margin: 24 })).toBe(358);
  });
});
