import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useOverlayLayer } from "../../hooks/useOverlayLayer";
import { computeListPosition } from "../../utils/computeListPosition";
import { computeScrollIntoBand } from "../../utils/computeScrollIntoBand";
import type { ViewportBox } from "../../utils/computeListPosition";

/**
 * Fixed chrome pinned to the bottom of the screen — the onboarding footer,
 * the mobile nav — carries this attribute so any floating overlay can stay
 * clear of it without being told about the page it lives on.
 */
const BOTTOM_BAR_SELECTOR = "[data-overlay-bottom-bar]";

/**
 * What actually scrolls above `el`. Usually the page, but a Modal's panel is a
 * real scroller (overflow-y: auto, max-height) and hosts the long transaction
 * form — there, scrolling the window would be a silent no-op.
 */
function scrollerFor(el: HTMLElement): HTMLElement | Window {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
  }
  return window;
}

function readViewport(): ViewportBox {
  const vv = window.visualViewport;
  return {
    width: vv?.width ?? window.innerWidth,
    height: vv?.height ?? window.innerHeight,
    offsetTop: vv?.offsetTop ?? 0,
    offsetLeft: vv?.offsetLeft ?? 0,
    layoutHeight: document.documentElement.clientHeight || window.innerHeight,
  };
}

/**
 * How much of the visible viewport the bottom chrome eats, measured rather
 * than declared. That is what makes it right on both platforms: Android
 * Chrome resizes the layout viewport so the bar rides up above the keyboard
 * and keeps its full height here, while iOS Safari leaves it pinned beneath
 * the keyboard, outside the visible slice, where this returns 0 — correctly,
 * because there is nothing left to avoid.
 */
function bottomInsetFrom(visibleBottom: number): number {
  let inset = 0;
  document.querySelectorAll<HTMLElement>(BOTTOM_BAR_SELECTOR).forEach((bar) => {
    const rect = bar.getBoundingClientRect();
    if (rect.height === 0) return; // display: none at this breakpoint
    // Only bars actually pinned to the screen are in the way. The onboarding
    // footer wears the attribute at every width but goes back into the flow
    // above 768px, where it is just more page content to scroll past.
    if (getComputedStyle(bar).position !== "fixed") return;
    inset = Math.max(inset, visibleBottom - rect.top);
  });
  return Math.max(0, inset);
}

interface Props {
  /** Names to suggest. Anything already used should be filtered out by the caller. */
  suggestions: string[];
  onSelect: (value: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  label: string;
  autoFocus?: boolean;
  disabled?: boolean;
  /**
   * Controlled mode: the field mirrors this value instead of managing its own
   * draft, and never clears itself after a commit — every keystroke and every
   * pick both just call `onSelect` with the new text. Use this to embed the
   * combobox as a normal persistent form field (e.g. a card network picker)
   * rather than the default one-shot "type or create, then reset" affordance.
   */
  value?: string;
  /** Visible label above the field, like TextField/Select. Only meaningful — and
   * only rendered — in controlled mode; the uncontrolled "add" usage relies on
   * surrounding context (a chip, a section heading) instead. */
  fieldLabel?: string;
}

/**
 * Text input with a filtered suggestion list. When the typed text matches no
 * suggestion, a "Create ..." row is offered so the user is never blocked by the
 * preset list.
 */
export function Combobox({
  suggestions,
  onSelect,
  onCancel,
  placeholder = "Search or create",
  label,
  autoFocus,
  disabled,
  value,
  fieldLabel,
}: Props) {
  const isControlled = value !== undefined;
  const [internalDraft, setInternalDraft] = useState("");
  const draft = isControlled ? value : internalDraft;
  const [highlight, setHighlight] = useState(0);
  // Only the controlled (persistent field) usage needs real open/close state —
  // the uncontrolled "add" usage is mounted only while actively adding, so it
  // has always shown its options immediately, and changing that would break
  // existing callers and their tests.
  const [focused, setFocused] = useState(false);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Null until measured; the list renders hidden for that one frame so it
  // never flashes at the wrong place.
  const [pos, setPos] = useState<React.CSSProperties | null>(null);
  // One scroll per opening, no matter how much the viewport churns.
  const nudged = useRef(false);
  // The list portals onto the body, so nothing but z-index ranks it against
  // a modal's scrim — and a modal's own list has to clear it.
  const { depth, menuZIndex } = useOverlayLayer();

  const trimmed = draft.trim();

  const matches = useMemo(() => {
    if (!trimmed) return suggestions;
    const needle = trimmed.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(needle));
  }, [suggestions, trimmed]);

  // Offer creation unless the text exactly matches something already listed.
  const canCreate =
    trimmed.length > 0 && !suggestions.some((s) => s.toLowerCase() === trimmed.toLowerCase());

  const options = useMemo(
    () => [...matches, ...(canCreate ? [trimmed] : [])],
    [matches, canCreate, trimmed]
  );
  const createIndex = canCreate ? options.length - 1 : -1;
  const showList = (isControlled ? focused : true) && options.length > 0 && !disabled;

  useEffect(() => {
    setHighlight(0);
  }, [trimmed]);

  // Clicking outside is a cancel, not a create — the old inline input committed
  // on blur, which made stray categories far too easy to produce. The list is
  // portaled onto document.body (see below), so its own DOM sits outside
  // rootRef and needs its own containment check.
  useEffect(() => {
    if (!onCancel) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      onCancel();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [onCancel]);

  // Every Card wears `.glass`, and `backdrop-filter` makes it both a stacking
  // context and a containing block — so a list positioned inside one can
  // never be ranked against a later card, the FAB or the mobile nav, whatever
  // its z-index (see KebabMenu). The only way out is to render it somewhere
  // else: the list lives on `document.body`, positioned against the input's
  // viewport rect.
  useEffect(() => {
    if (!showList) {
      setPos(null);
      return;
    }
    let frame = 0;
    const measure = () => {
      const input = inputRef.current;
      if (!input) return;
      const rect = input.getBoundingClientRect();
      const viewport = readViewport();
      const bottomInset = bottomInsetFrom(viewport.offsetTop + viewport.height);
      const { placement, ...style } = computeListPosition(rect, viewport, { bottomInset });
      // Replaced wholesale, never merged: the flipped result carries `bottom`
      // and the normal one `top`, and a merge would leave the stale key behind.
      setPos(style);

      // The field itself has to be readable, not just the list. This lives
      // here, inside the cycle that already tracks the visual viewport,
      // because the keyboard is the thing that pushes the field out of sight
      // and its arrival is the only moment we can know that. Deciding once a
      // frame after mount — as this used to — asks the question before the
      // keyboard has answered it.
      if (nudged.current) return;
      const delta = computeScrollIntoBand(rect, viewport, { bottomInset });
      if (delta === 0) return;
      // Armed only when it actually moves the page, so an evaluation that ran
      // too early cannot disarm it.
      nudged.current = true;
      // Instant, not smooth: a smooth scroll leaves the rect stale for frames
      // while the capture-phase listener below re-fires, and it fights the
      // browser's own focus scroll. Element.scrollBy is absent in jsdom.
      scrollerFor(input).scrollBy?.({ top: delta });
    };
    // The keyboard animates, and iOS fires visualViewport scroll continuously
    // while it does; coalesce so we lay out once per frame.
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };
    measure();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    // iOS Safari fires neither of those for the software keyboard: the layout
    // viewport is untouched, only the visual one shrinks — and when Safari
    // scrolls the focused field into view it scrolls the *visual* viewport, so
    // the window scroll listener stays quiet too. Without these the fixed
    // coordinates go stale exactly when the keyboard is up.
    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      // Re-arm for the next opening. An uncontrolled combobox unmounts and
      // takes the ref with it, but a controlled one stays mounted and only
      // flips `showList` on blur — without this it would scroll into view the
      // first time it was focused and never again.
      nudged.current = false;
    };
  }, [showList]);

  const commit = (index: number) => {
    const picked = options[index];
    if (!picked) return;
    onSelect(picked);
    if (!isControlled) setInternalDraft("");
    setFocused(false);
  };

  return (
    <div className={`combobox${fieldLabel ? " full-width" : ""}`} ref={rootRef}>
      {fieldLabel && (
        <label className="label" htmlFor={listId}>
          {fieldLabel}
        </label>
      )}
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        ref={inputRef}
        id={fieldLabel ? listId : undefined}
        className="input"
        type="text"
        role="combobox"
        disabled={disabled}
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${listId}-${highlight}` : undefined}
        aria-label={label}
        placeholder={placeholder}
        // iOS autocorrect silently rewriting a typed name before it commits is
        // a real way to end up with a category you never asked for.
        autoCorrect="off"
        autoCapitalize="sentences"
        spellCheck={false}
        enterKeyHint="done"
        value={draft}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const next = e.currentTarget.value;
          setFocused(true);
          if (isControlled) onSelect(next);
          else setInternalDraft(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => (options.length ? (h + 1) % options.length : 0));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => (options.length ? (h - 1 + options.length) % options.length : 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            commit(highlight);
          } else if (e.key === "Escape") {
            e.preventDefault();
            if (isControlled) {
              setFocused(false);
            } else {
              setInternalDraft("");
              onCancel?.();
            }
          }
        }}
      />

      {showList &&
        typeof document !== "undefined" &&
        createPortal(
          <ul
            ref={listRef}
            className="glass glass--strong glass--raised list"
            id={listId}
            role="listbox"
            aria-label={label}
            style={{
              ...(pos ?? { top: 0, left: 0, visibility: "hidden" }),
              // Composed at render, never folded into `pos`, so the wholesale
              // replacement the measure effect relies on stays true. On the
              // page the stylesheet's var(--z-menu) is already right.
              ...(depth > 0 ? { zIndex: menuZIndex } : null),
            }}
          >
            {options.map((option, i) => (
              <li
                key={`${option}-${i}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === highlight}
                className={`option${i === createIndex ? " create" : ""}${
                  i === highlight ? " highlighted" : ""
                }`}
                onMouseEnter={() => setHighlight(i)}
                // mousedown fires before the input's blur, so the click isn't lost
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(i);
                }}
              >
                {i === createIndex ? (
                  <>
                    Create <strong>&ldquo;{option}&rdquo;</strong>
                  </>
                ) : (
                  option
                )}
              </li>
            ))}
          </ul>,
          document.body
        )}

      <style jsx>{`
        .combobox {
          position: relative;
          display: inline-flex;
          flex-direction: column;
          gap: 6px;
          width: 200px;
        }

        .combobox.full-width {
          width: 100%;
        }

        .label {
          font-size: 0.8125rem;
          color: var(--fg-1);
        }

        /* Scoped through .combobox so it beats the blanket input rule in
           globals.css — otherwise the input keeps its own border inside this
           one and renders as a double ring. */
        .combobox .input {
          width: 100%;
          min-width: 0;
          min-height: 34px;
          height: 34px;
          padding: 0 14px;
          border-radius: var(--r-pill);
          border: 1px solid var(--accent);
          background-color: var(--glass-field);
          backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
          -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
          box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.06);
          color: var(--fg-0);
          font-family: inherit;
          font-size: 16px;
        }

        .combobox.full-width .input {
          height: 40px;
          border-radius: var(--r-md);
          border-color: var(--glass-rim);
        }

        .combobox .input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-soft);
        }

        .combobox .input::placeholder {
          color: var(--fg-2);
        }

        .combobox .input:disabled {
          opacity: 0.5;
        }

        /* Fixed, because it is mounted on the body: the position comes from
           the input's rect (see the positioning effect above). Above the nav
           and the FAB, below a modal — which it can finally honour, now that
           no ancestor's backdrop-filter traps it. That ranking is right only
           for a list opened from the page; one owned by a modal is lifted
           above that modal's scrim inline (see useOverlayLayer). */
        .list {
          position: fixed;
          z-index: var(--z-menu, 150);
          margin: 0;
          padding: 4px;
          list-style: none;
          /* No min-width: it fought the viewport clamp on a 320px screen. The
             floor lives in computeListPosition, which knows the viewport. */
          min-width: 0;
          /* Safety net for the one frame before measurement; the real value
             arrives inline, from the room actually available. */
          max-height: 320px;
          overflow-y: auto;
          /* Scrolling the suggestions must not start scrolling the page. */
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          border-radius: var(--r-lg);
        }

        .option {
          padding: 8px 12px;
          border-radius: var(--r-sm);
          font-size: 0.875rem;
          color: var(--fg-1);
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        /* Fingers, not cursors: 44px is the smallest target that is reliably
           hit first try. Desktop keeps its denser rows. */
        @media (pointer: coarse) {
          .option {
            display: flex;
            align-items: center;
            min-height: 44px;
            font-size: 0.9375rem;
          }
        }

        /* "Create ..." is the way out of the preset list, so it must never be
           the row that scrolled out of sight. */
        .option.create {
          position: sticky;
          bottom: -4px;
          /* The same glass fill, stacked: one layer at 0.85 lets the options
             scrolling underneath read straight through the row. Two are opaque
             enough to hide them without hardcoding a colour, and both collapse
             to the flat --bg-1 fallback together. */
          background-color: var(--glass-raised);
          background-image: linear-gradient(var(--glass-raised), var(--glass-raised));
          border-top: 1px solid var(--glass-rim);
          border-radius: 0 0 var(--r-sm) var(--r-sm);
          color: var(--fg-0);
        }

        .option.highlighted {
          background: var(--glass-hover);
          color: var(--fg-0);
        }

        /* The shorthand above resets background-image, which would drop the
           create row back to a single translucent layer just as it is
           highlighted. Stack the hover tint over the fill instead. */
        .option.create.highlighted {
          background-color: var(--glass-raised);
          background-image: linear-gradient(var(--glass-hover), var(--glass-hover));
        }
      `}</style>
    </div>
  );
}
