import { useEffect, useRef, useState } from "react";

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

export function KebabMenu({ actions, "aria-label": ariaLabel = "More options" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
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

      {open && (
        <div className="glass glass--strong glass--raised menu" role="menu">
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
        </div>
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

        .menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          /* Above the floating create button, below modal overlays. */
          z-index: calc(var(--z-fab, 110) + 1);
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
