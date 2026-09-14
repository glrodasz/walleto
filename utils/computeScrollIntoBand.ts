import type { AnchorRect, ViewportBox } from "./computeListPosition";

export interface ScrollIntoBandOptions {
  /** Breathing room kept inside each edge of the band. */
  margin?: number;
  /** Height of fixed chrome pinned to the bottom of the visible viewport. */
  bottomInset?: number;
}

const DEFAULTS = { margin: 8, bottomInset: 0 };

/**
 * How far the page has to scroll for `rect` to sit inside the part of it the
 * user can actually see — positive to scroll down, negative up, 0 when it
 * already fits.
 *
 * The band is the *visible* slice, not the layout viewport, which is the whole
 * reason this exists: on iOS the layout viewport does not shrink when the
 * keyboard opens, so scrollIntoView's own alignment lands behind the keyboard.
 * Minimal by design — the field is brought just inside the nearest edge rather
 * than recentred, so the page moves as little as possible under the user.
 */
export function computeScrollIntoBand(
  rect: Pick<AnchorRect, "top" | "bottom">,
  viewport: ViewportBox,
  options: ScrollIntoBandOptions = {}
): number {
  const { margin, bottomInset } = { ...DEFAULTS, ...options };

  const bandTop = viewport.offsetTop + margin;
  const bandBottom = viewport.offsetTop + viewport.height - bottomInset - margin;

  // Taller than the band: align its top, so what you see is where the field
  // starts rather than where it ends.
  if (rect.bottom - rect.top > bandBottom - bandTop) return rect.top - bandTop;
  if (rect.bottom > bandBottom) return rect.bottom - bandBottom;
  if (rect.top < bandTop) return rect.top - bandTop;
  return 0;
}
