import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "../atoms/Icons";
import { useOverlayLayer } from "../../hooks/useOverlayLayer";
import { useT } from "../../hooks/useT";
import { UI_MESSAGES } from "../../messages/ui";
import type { Scenario } from "../../types";

const SCENARIOS: Scenario[] = ["floor", "average", "top"];
/** Distance between the pill and the menu. */
const GAP = 6;
/** Room kept free between the menu and the viewport's edges. */
const EDGE = 8;

interface Props {
  value: Scenario;
  onChange: (scenario: Scenario) => void | Promise<void>;
}

/**
 * Best / Average / Worst: which end of each variable expense's band every
 * total counts. A pill naming the current pick ("Worst ▾"), so it fits on the
 * header's one line next to the privacy, currency and month controls; the
 * menu carries the question and what each end means.
 *
 * The pick shows at once; the figures follow when the saved choice comes back
 * from the account. The menu is portaled onto the body for the same reason
 * MonthPicker's list is: the header bar is glass, and glass traps anything
 * positioned inside it.
 */
export function ScenarioPicker({ value, onChange }: Props) {
  const t = useT(UI_MESSAGES);
  const [picked, setPicked] = useState(value);
  useEffect(() => setPicked(value), [value]);

  const [open, setOpen] = useState(false);
  // Null until measured; the menu renders hidden for that one frame so it
  // never flashes at the wrong place.
  const [pos, setPos] = useState<React.CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { depth, menuZIndex } = useOverlayLayer();

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const choose = (next: Scenario) => {
    close(true);
    if (next === picked) return;
    setPicked(next);
    Promise.resolve(onChange(next)).catch(() => setPicked(value));
  };

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const trigger = triggerRef.current?.getBoundingClientRect();
    const menu = menuRef.current?.getBoundingClientRect();
    if (!trigger || !menu) return;
    // Under the pill, lined up with its left edge unless that runs the menu
    // off the right of a phone.
    setPos({
      top: trigger.bottom + GAP,
      left: Math.max(EDGE, Math.min(trigger.left, window.innerWidth - menu.width - EDGE)),
    });
  }, [open]);

  useEffect(() => {
    if (!open || !pos) return;
    menuRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
  }, [open, pos]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // The menu is outside this component's DOM, so it needs its own check.
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    // Fixed coordinates go stale the moment the page moves under them.
    const onMove = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  // Up/Down walk the three options; Tab leaves, like a select would.
  const onMenuKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      close(true);
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []
    );
    const at = items.indexOf(document.activeElement as HTMLElement);
    const to = Math.min(items.length - 1, Math.max(0, at + (e.key === "ArrowDown" ? 1 : -1)));
    items[to]?.focus();
  };

  const current = t(`scenario.${picked}`);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="glass glass--tap trigger"
        data-scenario-picker=""
        aria-label={t("scenario.current", { scenario: current })}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close(false) : setOpen(true))}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="value">{current}</span>
        <span className="chevron" aria-hidden="true">
          <ChevronDown size={14} />
        </span>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="glass glass--strong glass--raised menu"
            role="menu"
            aria-labelledby={titleId}
            style={{
              ...(pos ?? { top: 0, left: 0, visibility: "hidden" }),
              ...(depth > 0 ? { zIndex: menuZIndex } : null),
            }}
            onKeyDown={onMenuKey}
          >
            <p id={titleId} className="title">
              {t("scenario.label")}
            </p>
            {SCENARIOS.map((key) => {
              const checked = key === picked;
              return (
                <button
                  key={key}
                  type="button"
                  role="menuitemradio"
                  aria-checked={checked}
                  tabIndex={-1}
                  className={`option${checked ? " is-selected" : ""}`}
                  onClick={() => choose(key)}
                >
                  <span className="check">{checked && <Check size={14} />}</span>
                  {t(`scenario.${key}`)}
                </button>
              );
            })}
            <p className="hint">{t("scenario.hint")}</p>
          </div>,
          document.body
        )}

      <style jsx>{`
        .trigger {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 40px;
          padding: 0 10px 0 12px;
          flex-shrink: 0;
          border-radius: var(--r-md);
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--fg-0);
          white-space: nowrap;
          cursor: pointer;
        }

        .chevron {
          display: inline-flex;
          color: var(--fg-2);
        }

        .trigger:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px var(--accent);
        }

        /* Fixed, because it is mounted on the body: the position comes from
           the pill's rect. Above the nav and the FAB, below a modal (see
           KebabMenu and useOverlayLayer). */
        .menu {
          position: fixed;
          z-index: var(--z-menu, 150);
          width: max-content;
          max-width: min(260px, calc(100vw - 16px));
          border-radius: var(--r-lg);
          padding: 4px;
          display: flex;
          flex-direction: column;
        }

        .title {
          margin: 0;
          padding: 8px 12px 4px;
          font-size: 0.75rem;
          color: var(--fg-2);
        }

        .option {
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
        .option:focus-visible {
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
          color: var(--accent);
        }

        .hint {
          margin: 4px 0 0;
          padding: 8px 12px;
          border-top: 1px solid var(--glass-rim);
          font-size: 0.75rem;
          line-height: 1.4;
          color: var(--fg-2);
        }

        @media (max-width: 767px) {
          /* On a phone the pill shares one line with three other controls;
             the pick itself says it opens. */
          .chevron {
            display: none;
          }

          .trigger {
            padding: 0 10px;
          }

          .option {
            padding: 11px 14px 11px 10px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </>
  );
}
