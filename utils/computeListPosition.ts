/** The bit of the anchor's rect that matters for placement. */
export interface AnchorRect {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

/**
 * The visible slice of the page, in the same client coordinates a
 * `getBoundingClientRect()` speaks: `offsetTop`/`offsetLeft` are how far the
 * visual viewport has been pushed inside the layout viewport (the iOS
 * keyboard, pinch-zoom). `layoutHeight` is kept separate because a fixed
 * element resolves `bottom` against the *layout* viewport, never against the
 * visible slice.
 */
export interface ViewportBox {
  width: number;
  height: number;
  offsetTop: number;
  offsetLeft: number;
  layoutHeight: number;
}

export interface ListPositionOptions {
  /** Distance between the anchor and the list. */
  gap?: number;
  /** Breathing room kept against every viewport edge. */
  margin?: number;
  /** Never narrower than this, so suggestions don't truncate. */
  minWidth?: number;
  /** Ceiling: the list never grows past it, even with room to spare. */
  maxHeight?: number;
  /** Below this much room, prefer flipping above the anchor. */
  comfortableHeight?: number;
  /** Height of fixed chrome pinned to the bottom of the visible viewport. */
  bottomInset?: number;
}

export type ListPosition = { left: number; width: number; maxHeight: number } & (
  | { placement: "below"; top: number }
  | { placement: "above"; bottom: number }
);

const DEFAULTS = {
  gap: 6,
  margin: 8,
  minWidth: 240,
  maxHeight: 320,
  // Roughly four rows at the coarse-pointer height.
  comfortableHeight: 176,
  bottomInset: 0,
};

/**
 * Never collapse to a sliver: show at least this much even in a viewport with
 * no good answer, and let the list scroll inside it.
 */
const MIN_HEIGHT = 96;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Where to put a floating list anchored to an input, given how much of the
 * page is actually visible. Pure on purpose: the component that uses it can
 * only be tested through a DOM with no layout, so the interesting decisions —
 * flip, clamp, slide back inside the edges — live here instead.
 */
export function computeListPosition(
  rect: AnchorRect,
  viewport: ViewportBox,
  options: ListPositionOptions = {}
): ListPosition {
  const { gap, margin, minWidth, maxHeight, comfortableHeight, bottomInset } = {
    ...DEFAULTS,
    ...options,
  };

  const viewTop = viewport.offsetTop + margin;
  const viewBottom = viewport.offsetTop + viewport.height - margin - bottomInset;
  const viewLeft = viewport.offsetLeft + margin;
  const viewRight = viewport.offsetLeft + viewport.width - margin;

  const roomBelow = viewBottom - (rect.bottom + gap);
  const roomAbove = rect.top - gap - viewTop;

  // Flip only when below is genuinely cramped *and* above is roomier. A flip
  // that buys nothing just moves the problem and disorients the user.
  const above = roomBelow < Math.min(comfortableHeight, maxHeight) && roomAbove > roomBelow;
  const room = above ? roomAbove : roomBelow;
  const height = clamp(room, MIN_HEIGHT, maxHeight);

  // At least as wide as the anchor, never wider than the viewport, then slid
  // back inside both edges — a right-aligned chip on a 360px screen would
  // otherwise push a 240px list off the right of the screen.
  const width = Math.min(Math.max(rect.width, minWidth), Math.max(viewRight - viewLeft, 0));
  const left = clamp(rect.left, viewLeft, viewRight - width);

  return above
    ? // Anchored by its *bottom* so it grows upward out of the input; pinning
      // `top` at the max height would leave it floating away from the field
      // whenever the content is shorter (same trick as KebabMenu).
      {
        placement: "above",
        bottom: viewport.layoutHeight - (rect.top - gap),
        left,
        width,
        maxHeight: height,
      }
    : { placement: "below", top: rect.bottom + gap, left, width, maxHeight: height };
}
