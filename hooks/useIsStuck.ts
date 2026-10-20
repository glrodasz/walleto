import { useEffect, useState } from "react";
import type { RefObject } from "react";

/**
 * Whether a `position: sticky` element is pinned right now: its top has
 * reached the `top` its CSS gives it. Read from the computed style, so one
 * element can stick at different offsets per breakpoint.
 */
export function useIsStuck(ref: RefObject<HTMLElement>): boolean {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const top = parseFloat(getComputedStyle(el).top) || 0;
      // Half a pixel of slack for subpixel layout; nothing is stuck before
      // the page has moved.
      setStuck(window.scrollY > 0 && el.getBoundingClientRect().top <= top + 0.5);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref]);

  return stuck;
}
