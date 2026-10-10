/** How far in from a scroll edge an item fades out, in px. */
export const EDGE_FADE = 48;

/** A horizontal span in viewport coordinates (getBoundingClientRect's left/right). */
export interface Span {
  start: number;
  end: number;
}

/**
 * The four stops (px, relative to the item's own left edge) of the mask that
 * fades an item where it runs under an edge with more to scroll:
 * transparent → opaque on the start side, opaque → transparent on the end
 * side. `null` when the item is clear of both fading edges.
 *
 * Each item carries its own mask, never the row: a masked ancestor becomes a
 * backdrop root and the glass inside it stops blurring the page.
 */
export function edgeFade(
  item: Span,
  port: Span,
  fadeStart: boolean,
  fadeEnd: boolean,
  size = EDGE_FADE
): [number, number, number, number] | null {
  const atStart = fadeStart && item.start < port.start + size;
  const atEnd = fadeEnd && item.end > port.end - size;
  if (!atStart && !atEnd) return null;
  const width = item.end - item.start;
  return [
    atStart ? port.start - item.start : 0,
    atStart ? port.start + size - item.start : 0,
    atEnd ? port.end - size - item.start : width,
    atEnd ? port.end - item.start : width,
  ];
}

/**
 * Where a drag settles: the item start (as a scroll position) nearest to
 * where the throw would have carried it, or either end of the row.
 */
export function snapTarget(starts: number[], projected: number, max: number): number {
  const candidates = [0, max, ...starts.map((s) => Math.min(Math.max(s, 0), max))];
  return candidates.reduce((best, c) =>
    Math.abs(c - projected) < Math.abs(best - projected) ? c : best
  );
}
