import { useEffect, useRef } from "react";
import { edgeFade, snapTarget } from "../helpers/scrollRow";

/** Mouse travel before a press becomes a drag (below it, it's still a click). */
const DRAG_THRESHOLD = 4;
/** How far a release throws the row: px/ms of the last move × this. */
const THROW_MS = 200;
/** Fallback for browsers without `scrollend`. */
const SETTLE_MS = 600;
/** A press here is the target's own (the card's header link), never a drag. */
const INTERACTIVE = "a, button, input, select, textarea, label, [role='button']";

/**
 * A horizontally scrolling row: fades the items under an edge that has more to
 * scroll, and lets a mouse drag it like a carousel (touch and trackpads scroll
 * natively). State goes on the DOM as data attributes, not React state, so a
 * scroll or a drag never re-renders the page:
 *
 * - row `data-overflowing` — there's something to scroll (show `grab`).
 * - row `data-dragging` / `data-settling` — a drag, and its throw (turn snapping off).
 * - item `data-edge-fade` + `--fade-0..3` — the stops of its own mask.
 */
export function useScrollRow<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const updateRef = useRef<() => void>(() => {});

  useEffect(() => {
    const row = ref.current;
    if (!row) return;

    const update = () => {
      const max = row.scrollWidth - row.clientWidth;
      const overflowing = max > 1;
      toggle(row, "overflowing", overflowing);
      const rect = row.getBoundingClientRect();
      const start = rect.left + row.clientLeft;
      const port = { start, end: start + row.clientWidth };
      for (const item of Array.from(row.children)) {
        if (!(item instanceof HTMLElement)) continue;
        const r = item.getBoundingClientRect();
        const stops = overflowing
          ? edgeFade(
              { start: r.left, end: r.right },
              port,
              row.scrollLeft > 1,
              row.scrollLeft < max - 1
            )
          : null;
        toggle(item, "edgeFade", stops !== null);
        stops?.forEach((v, i) => item.style.setProperty(`--fade-${i}`, `${v}px`));
      }
    };
    updateRef.current = update;

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    const resize = new ResizeObserver(schedule);
    resize.observe(row);
    row.addEventListener("scroll", schedule, { passive: true });

    let drag: {
      id: number;
      x: number;
      left: number;
      moved: boolean;
      lastX: number;
      lastT: number;
      velocity: number;
    } | null = null;
    let swallowClick = false;
    let settleTimer = 0;

    const onPointerDown = (e: PointerEvent) => {
      swallowClick = false;
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if (row.dataset.overflowing === undefined) return;
      if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return;
      drag = {
        id: e.pointerId,
        x: e.clientX,
        left: row.scrollLeft,
        moved: false,
        lastX: e.clientX,
        lastT: e.timeStamp,
        velocity: 0,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        drag.moved = true;
        row.setPointerCapture(e.pointerId);
        clearTimeout(settleTimer);
        delete row.dataset.settling;
        row.dataset.dragging = "";
        window.getSelection()?.removeAllRanges();
      }
      const dt = e.timeStamp - drag.lastT;
      if (dt > 0) drag.velocity = -(e.clientX - drag.lastX) / dt;
      drag.lastX = e.clientX;
      drag.lastT = e.timeStamp;
      row.scrollLeft = drag.left - dx;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const { moved, velocity } = drag;
      drag = null;
      if (!moved) return;
      swallowClick = true;
      setTimeout(() => (swallowClick = false), 0);
      delete row.dataset.dragging;

      // Snapping is off while the hand moves the row; settle on an item start
      // ourselves, then hand snapping back once the throw has landed.
      const max = row.scrollWidth - row.clientWidth;
      const rowLeft = row.getBoundingClientRect().left + row.clientLeft;
      const padding = parseFloat(getComputedStyle(row).paddingLeft) || 0;
      const starts = Array.from(row.children).map(
        (c) => c.getBoundingClientRect().left - rowLeft + row.scrollLeft - padding
      );
      const target = snapTarget(starts, row.scrollLeft + velocity * THROW_MS, max);
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      row.dataset.settling = "";
      const settled = () => {
        clearTimeout(settleTimer);
        row.removeEventListener("scrollend", settled);
        delete row.dataset.settling;
      };
      row.addEventListener("scrollend", settled);
      settleTimer = window.setTimeout(settled, SETTLE_MS);
      row.scrollTo({ left: target, behavior: reduced ? "auto" : "smooth" });
    };

    // The click that ends a drag isn't a click on whatever it ended over.
    const onClick = (e: MouseEvent) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.preventDefault();
      e.stopPropagation();
    };

    row.addEventListener("pointerdown", onPointerDown);
    row.addEventListener("pointermove", onPointerMove);
    row.addEventListener("pointerup", onPointerUp);
    row.addEventListener("pointercancel", onPointerUp);
    row.addEventListener("click", onClick, true);
    update();

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
      resize.disconnect();
      row.removeEventListener("scroll", schedule);
      row.removeEventListener("pointerdown", onPointerDown);
      row.removeEventListener("pointermove", onPointerMove);
      row.removeEventListener("pointerup", onPointerUp);
      row.removeEventListener("pointercancel", onPointerUp);
      row.removeEventListener("click", onClick, true);
    };
  }, []);

  // The items change (skeletons → cards) without the row changing size.
  useEffect(() => updateRef.current());

  return ref;
}

function toggle(el: HTMLElement, key: string, on: boolean) {
  if (on) el.dataset[key] = "";
  else delete el.dataset[key];
}
