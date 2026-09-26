import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Info } from "./Icons";

/** Room the bubble keeps from either edge of the viewport. */
const GUTTER = 16;

// useLayoutEffect warns during SSR; the measurement only matters in the browser.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface Props {
  /** Accessible name of the trigger, e.g. "About continuing later". */
  label: string;
  children: ReactNode;
  /** Where the bubble opens relative to the icon. Defaults to above it. */
  placement?: "top" | "bottom";
}

/**
 * An "i" that explains something on hover, keyboard focus or tap. Hover and
 * focus are pure CSS; a tap toggles it (touch has no hover) and a tap outside
 * or Escape closes it. The bubble is always in the DOM — hidden, not
 * unmounted — so the trigger's `aria-describedby` always resolves, and so it
 * can be measured and nudged back inside the viewport before it shows.
 */
export function InfoTip({ label, children, placement = "top" }: Props) {
  const id = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  // Escape has to beat hover and focus too, until the pointer or focus leaves.
  const [dismissed, setDismissed] = useState(false);

  // Written straight to the element, not through state: the measurement has
  // to see the unshifted position, and there is nothing else to re-render.
  const nudge = useCallback(() => {
    const bubble = bubbleRef.current;
    if (!bubble || typeof window === "undefined") return;
    bubble.style.transform = "";
    const { left, right } = bubble.getBoundingClientRect();
    const max = window.innerWidth - GUTTER;
    let shift = 0;
    if (right > max) shift = max - right;
    if (left + shift < GUTTER) shift = GUTTER - left;
    if (shift) bubble.style.transform = `translateX(${shift}px)`;
  }, []);

  useIsomorphicLayoutEffect(() => {
    nudge();
    window.addEventListener("resize", nudge);
    return () => window.removeEventListener("resize", nudge);
  }, [nudge]);

  useEffect(() => {
    if (!open && !dismissed) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setDismissed(true);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, dismissed]);

  const reset = () => setDismissed(false);

  return (
    <span
      ref={rootRef}
      className={`infotip${open ? " is-open" : ""}${dismissed ? " is-dismissed" : ""}`}
      onPointerEnter={nudge}
      onPointerLeave={reset}
    >
      <button
        type="button"
        className="trigger"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={id}
        onClick={() => {
          nudge();
          setDismissed(false);
          setOpen((current) => !current);
        }}
        onFocus={nudge}
        onBlur={reset}
      >
        <Info size={14} />
      </button>
      <span
        ref={bubbleRef}
        id={id}
        role="tooltip"
        className={`glass glass--strong glass--raised bubble bubble--${placement}`}
      >
        {children}
      </span>

      <style jsx>{`
        .infotip {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .trigger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          /* A 28px target around a 14px glyph: easy to tap, quiet to look at. */
          width: 28px;
          height: 28px;
          margin: -7px;
          padding: 0;
          border: none;
          border-radius: var(--r-pill);
          background: none;
          color: var(--fg-2);
          cursor: pointer;
        }

        .trigger:hover,
        .is-open .trigger {
          color: var(--fg-0);
        }

        .bubble {
          position: absolute;
          left: -8px;
          z-index: var(--z-menu);
          width: max-content;
          /* 2 × GUTTER: never wider than the viewport minus its gutters. */
          max-width: min(280px, calc(100vw - 32px));
          padding: 10px 12px;
          border-radius: var(--r-md);
          font-size: 0.8125rem;
          font-weight: 400;
          line-height: 1.45;
          color: var(--fg-1);
          text-align: left;
          white-space: normal;
          visibility: hidden;
          opacity: 0;
          pointer-events: none;
          transition:
            opacity 0.12s ease,
            visibility 0.12s;
        }

        .bubble--top {
          bottom: calc(100% + 10px);
        }

        .bubble--bottom {
          top: calc(100% + 10px);
        }

        .is-open .bubble,
        .trigger:focus-visible + .bubble {
          visibility: visible;
          opacity: 1;
          pointer-events: auto;
        }

        @media (hover: hover) {
          .infotip:hover .bubble {
            visibility: visible;
            opacity: 1;
            pointer-events: auto;
          }
        }

        /* Escape wins over hover and focus until the pointer or focus leaves. */
        .infotip.is-dismissed .trigger + .bubble {
          visibility: hidden;
          opacity: 0;
          pointer-events: none;
        }
      `}</style>
    </span>
  );
}
