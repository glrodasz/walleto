import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface KebabAction {
  label: string;
  onSelect: () => void;
  /** Renders in the hot accent — for destructive actions. */
  danger?: boolean;
  disabled?: boolean;
}

interface Props {
  actions: KebabAction[];
  "aria-label"?: string;
}

/** Distance between the trigger and the menu. */
const GAP = 6;

/**
 * A dropdown that has to escape its row.
 *
 * Every Card wears `.glass`, and `backdrop-filter` makes a card both a stacking
 * context and a containing block — so a menu positioned inside one can never be
 * ranked against a later card, the FAB or the mobile nav, whatever its z-index.
 * A dimmed row (`opacity`) traps it one level tighter still. The only way out is
 * to render it somewhere else: the menu lives on `document.body`, positioned
 * against the trigger's viewport rect.
 */
export function KebabMenu({ actions, "aria-label": ariaLabel = "More options" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Null until measured; the menu renders hidden for that one frame so it never
  // flashes at the wrong place.
  const [pos, setPos] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const trigger = rootRef.current?.getBoundingClientRect();
    const menu = menuRef.current?.getBoundingClientRect();
    if (!trigger || !menu) return;
    // Open downward unless the menu would run off the bottom and there is more
    // room above — which is the normal case for a kebab in a card's last row.
    const below = window.innerHeight - trigger.bottom;
    const flip = menu.height + GAP > below && trigger.top > below;
    setPos({
      right: Math.max(8, window.innerWidth - trigger.right),
      ...(flip
        ? { bottom: window.innerHeight - trigger.top + GAP }
        : { top: trigger.bottom + GAP }),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // The menu is outside this component's DOM now, so it needs its own check.
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
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

  return (
    <div className="kebab" ref={rootRef}>
      <button
        type="button"
        className="trigger"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ⋮
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="glass glass--strong glass--raised menu"
            role="menu"
            style={pos ?? { top: 0, right: 0, visibility: "hidden" }}
          >
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                className={`item${action.danger ? " danger" : ""}`}
                disabled={action.disabled}
                onClick={() => {
                  setOpen(false);
                  action.onSelect();
                }}
              >
                {action.label}
              </button>
            ))}
          </div>,
          document.body
        )}

      <style jsx>{`
        .kebab {
          position: relative;
          display: inline-flex;
        }

        .trigger {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          color: var(--fg-2);
          font-size: 1.1rem;
          cursor: pointer;
          border-radius: var(--r-pill);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition:
            background 0.15s,
            color 0.15s;
        }

        .trigger:hover {
          background: var(--glass-hover);
          color: var(--fg-1);
        }

        /* Fixed, because it is mounted on the body: the position comes from the
           trigger's rect. Above the nav and the FAB, below a modal — which it
           can finally honour, now that nothing traps it. */
        .menu {
          position: fixed;
          z-index: var(--z-menu, 150);
          min-width: 160px;
          border-radius: var(--r-lg);
          padding: 4px;
          display: flex;
          flex-direction: column;
        }

        .item {
          text-align: left;
          padding: 8px 12px;
          border: none;
          background: transparent;
          color: var(--fg-1);
          font-family: inherit;
          font-size: 0.85rem;
          border-radius: var(--r-sm);
          cursor: pointer;
        }

        .item:hover:not(:disabled) {
          background: var(--glass-hover);
          color: var(--fg-0);
        }

        .item.danger {
          color: var(--accent-hot);
        }

        .item:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @media (max-width: 767px) {
          .trigger {
            width: 36px;
            height: 36px;
            /* 44px hit area without growing the visible glyph. */
            margin: -4px;
            padding: 4px;
            box-sizing: content-box;
          }

          .item {
            padding: 12px 14px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
