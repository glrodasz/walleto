import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Calendar, Check, ChevronLeft, ChevronRight } from "../atoms/Icons";
import { formatDate } from "../../helpers/dates";
import { useOverlayLayer } from "../../hooks/useOverlayLayer";
import type { MonthWindow } from "../../features/domains/helpers/months";

interface Props {
  value: string;
  /** Oldest first, ending with the current month. */
  windows: MonthWindow[];
  onChange: (key: string) => void;
  onStep?: (delta: -1 | 1) => void;
}

/** How many months the list shows: the last six, then "Show more" twice. */
export const MONTH_LIST_STEPS = [6, 12, 24];
/** Distance between the pill and the list. */
const GAP = 6;
/** Room kept free under the list so it never touches the viewport's edge. */
const EDGE = 12;

/** The smallest step whose list still includes the selected month. */
function stepFor(windows: MonthWindow[], value: string): number {
  const fromNewest = windows.length - 1 - windows.findIndex((w) => w.key === value);
  const step = MONTH_LIST_STEPS.findIndex((count) => fromNewest < count);
  return step === -1 ? MONTH_LIST_STEPS.length - 1 : step;
}

/**
 * The header's "September 2026" control. Arrows step one month; the list
 * jumps. It never offers a month after the current one: the app reports on
 * what happened, and the future lives in the recurring plan.
 *
 * The list shows the last six months and grows to twelve, then twenty-four,
 * with "Show more" — which is why it is not a native select: a select cannot
 * hold a button that adds options without closing. It is portaled onto the
 * body for the same reason KebabMenu is (a glass header traps anything
 * positioned inside it), and opens at the step that contains the selected
 * month, so the selection is never hidden behind "Show more".
 *
 * The pill is as wide as the month it names and shortens it on phones —
 * "Sep 2026" — with one DOM for both widths. The step arrows already say it
 * is a picker, so there is no down arrow.
 */
export function MonthPicker({ value, windows, onChange, onStep }: Props) {
  const index = windows.findIndex((w) => w.key === value);
  const atOldest = index <= 0;
  const atNewest = index === -1 || index === windows.length - 1;
  const current = index === -1 ? null : windows[index];
  const step = (delta: -1 | 1) => {
    if (onStep) return onStep(delta);
    const next = windows[index + delta];
    if (next) onChange(next.key);
  };

  const [open, setOpen] = useState(false);
  const [listStep, setListStep] = useState(0);
  // Null until measured; the list renders hidden for that one frame so it
  // never flashes at the wrong place.
  const [pos, setPos] = useState<React.CSSProperties | null>(null);
  // The option to focus once the list is placed (or has grown).
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const { depth, menuZIndex } = useOverlayLayer();

  const count = Math.min(MONTH_LIST_STEPS[listStep], windows.length);
  const visible = windows.slice(windows.length - count).reverse();
  const nextCount =
    count < windows.length && listStep < MONTH_LIST_STEPS.length - 1
      ? Math.min(MONTH_LIST_STEPS[listStep + 1], windows.length)
      : null;

  const openList = () => {
    setListStep(stepFor(windows, value));
    setFocusKey(index === -1 ? (windows[windows.length - 1]?.key ?? null) : value);
    setOpen(true);
  };

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const pick = (key: string) => {
    close(true);
    if (key !== value) onChange(key);
  };

  const showMore = () => {
    if (nextCount === null) return;
    // Focus the first month the step adds, so the keyboard lands on news.
    setFocusKey(windows[windows.length - 1 - count]?.key ?? null);
    setListStep((s) => s + 1);
  };

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const trigger = triggerRef.current?.getBoundingClientRect();
    const menu = menuRef.current?.getBoundingClientRect();
    if (!trigger || !menu) return;
    const top = trigger.bottom + GAP;
    setPos({
      top,
      left: Math.max(8, Math.min(trigger.left, window.innerWidth - menu.width - 8)),
      maxHeight: Math.max(160, window.innerHeight - top - EDGE),
    });
  }, [open]);

  useEffect(() => {
    if (!open || !pos || !focusKey) return;
    const option = menuRef.current?.querySelector<HTMLElement>(`[data-key="${focusKey}"]`);
    option?.focus();
    option?.scrollIntoView?.({ block: "nearest" });
    setFocusKey(null);
  }, [open, pos, focusKey, listStep]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // The list is outside this component's DOM, so it needs its own check.
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    // Fixed coordinates go stale the moment the page moves under them — but
    // the list scrolls itself once it shows two years.
    const onScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // Up/Down walk the months and "Show more"; Tab leaves, like a select would.
  const onMenuKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      close(true);
      return;
    }
    const moves: Record<string, number> = {
      ArrowDown: 1,
      ArrowUp: -1,
      Home: -Infinity,
      End: Infinity,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[data-nav]") ?? []);
    if (!items.length) return;
    const at = items.indexOf(document.activeElement as HTMLElement);
    const move = moves[e.key];
    const to = Number.isFinite(move)
      ? Math.min(items.length - 1, Math.max(0, at + move))
      : move < 0
        ? 0
        : items.length - 1;
    items[to].focus();
  };

  return (
    <div className="glass picker">
      <button
        type="button"
        className="arrow"
        aria-label="Previous month"
        onClick={() => step(-1)}
        disabled={atOldest}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        ref={triggerRef}
        type="button"
        className="month"
        aria-label={`Month: ${current?.longLabel ?? ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            openList();
          }
        }}
      >
        <span className="icon" aria-hidden="true">
          <Calendar size={16} />
        </span>
        <span className="text long" aria-hidden="true">
          {current?.longLabel ?? ""}
        </span>
        <span className="text short" aria-hidden="true">
          {current ? formatDate(current.start, "monthYear") : ""}
        </span>
      </button>
      <button
        type="button"
        className="arrow"
        aria-label="Next month"
        onClick={() => step(1)}
        disabled={atNewest}
      >
        <ChevronRight size={16} />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="glass glass--strong glass--raised menu"
            style={{
              ...(pos ?? { top: 0, left: 0, visibility: "hidden" }),
              ...(depth > 0 ? { zIndex: menuZIndex } : null),
            }}
            onKeyDown={onMenuKey}
          >
            <div id={listId} className="options" role="listbox" aria-label="Month">
              {visible.map((w) => {
                const selected = w.key === value;
                return (
                  <button
                    key={w.key}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    tabIndex={-1}
                    data-nav=""
                    data-key={w.key}
                    className={`option${selected ? " is-selected" : ""}`}
                    onClick={() => pick(w.key)}
                  >
                    <span className="check">{selected && <Check size={14} />}</span>
                    {w.longLabel}
                  </button>
                );
              })}
            </div>
            {nextCount !== null && (
              <button type="button" className="more" tabIndex={-1} data-nav="" onClick={showMore}>
                Show last {nextCount} months
              </button>
            )}
          </div>,
          document.body
        )}

      <style jsx>{`
        .picker {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 2px;
          border-radius: var(--r-pill);
        }

        .arrow {
          display: inline-flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 34px;
          border: none;
          border-radius: var(--r-pill);
          background: transparent;
          color: var(--fg-2);
          cursor: pointer;
          transition:
            background 150ms ease,
            color 150ms ease;
        }

        .arrow:hover:not(:disabled) {
          background: var(--glass-hover);
          color: var(--fg-0);
        }

        .arrow:disabled {
          opacity: 0.35;
          cursor: default;
        }

        /* Inside the month button, so its hover and open state light the
           calendar glyph and the month as one target. */
        .icon {
          display: inline-flex;
          color: var(--fg-2);
          transition: color 150ms ease;
        }

        .month:hover .icon,
        .month[aria-expanded="true"] .icon {
          color: var(--fg-0);
        }

        .month {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 10px 0 8px;
          border: none;
          border-radius: var(--r-pill);
          background: transparent;
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--fg-0);
          white-space: nowrap;
          cursor: pointer;
          transition: background 150ms ease;
        }

        .month:hover,
        .month[aria-expanded="true"] {
          background: var(--glass-hover);
        }

        .month:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px var(--accent);
        }

        .short {
          display: none;
        }

        /* Fixed, because it is mounted on the body: the position comes from
           the pill's rect. Above the nav and the FAB, below a modal (see
           KebabMenu and useOverlayLayer). */
        .menu {
          position: fixed;
          z-index: var(--z-menu, 150);
          min-width: 200px;
          border-radius: var(--r-lg);
          padding: 4px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overscroll-behavior: contain;
        }

        .options {
          display: flex;
          flex-direction: column;
        }

        .option,
        .more {
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: left;
          padding: 7px 12px 7px 8px;
          border: none;
          background: transparent;
          color: var(--fg-1);
          font-family: inherit;
          font-size: 0.875rem;
          border-radius: var(--r-sm);
          cursor: pointer;
          white-space: nowrap;
        }

        .option:hover,
        .option:focus-visible,
        .more:hover,
        .more:focus-visible {
          outline: none;
          background: var(--glass-hover);
          color: var(--fg-0);
        }

        .option.is-selected {
          color: var(--fg-0);
          font-weight: 600;
        }

        .check {
          display: inline-flex;
          width: 14px;
          flex-shrink: 0;
          color: var(--accent);
        }

        .more {
          justify-content: center;
          margin-top: 4px;
          padding: 8px 12px;
          border-top: 1px solid var(--glass-rim);
          border-radius: 0 0 var(--r-sm) var(--r-sm);
          color: var(--accent);
          font-weight: 600;
        }

        /* Phones: the short month and no calendar glyph, so the picker shares
           a row with the privacy and currency pills. */
        @media (max-width: 767px) {
          .icon {
            display: none;
          }

          .long {
            display: none;
          }

          .short {
            display: inline;
          }

          .arrow {
            width: 28px;
          }

          .option,
          .more {
            padding-top: 11px;
            padding-bottom: 11px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
