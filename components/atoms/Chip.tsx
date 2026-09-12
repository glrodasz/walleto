import type { ReactNode } from "react";
import { Close, Plus } from "./Icons";

interface Props {
  children: ReactNode;
  /** Renders a × button; the chip stays non-interactive itself. */
  onRemove?: () => void;
  /** Turns the whole chip into a toggle button. */
  onClick?: () => void;
  selected?: boolean;
  /** Dashed outline + leading plus, for "Add category". */
  variant?: "solid" | "add";
  removeLabel?: string;
}

export function Chip({
  children,
  onRemove,
  onClick,
  selected = false,
  variant = "solid",
  removeLabel,
}: Props) {
  const classes = [
    "glass",
    onClick ? "glass--tap" : "",
    "chip",
    `chip--${variant}`,
    selected ? "chip--selected" : "",
    onClick ? "chip--clickable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className="wrap">
      {onClick ? (
        <button type="button" className={classes} onClick={onClick} aria-pressed={selected}>
          {variant === "add" && <Plus size={14} />}
          <span className="text">{children}</span>
        </button>
      ) : (
        <span className={classes}>
          {variant === "add" && <Plus size={14} />}
          <span className="text">{children}</span>
          {onRemove && (
            <button
              type="button"
              className="remove"
              onClick={onRemove}
              aria-label={removeLabel ?? "Remove"}
            >
              <Close size={14} />
            </button>
          )}
        </span>
      )}

      <style jsx>{`
        .wrap {
          display: inline-flex;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          /* Right padding shrinks when a × button supplies its own. */
          padding: 7px 14px;
          border-radius: var(--r-pill);
          color: var(--fg-0);
          font-family: inherit;
          font-size: 0.8125rem;
          font-weight: 500;
          line-height: 1.2;
          min-height: 34px;
        }

        .chip:has(.remove) {
          padding-right: 6px;
        }

        .chip--add {
          background-color: transparent;
          background-image: none;
          border-style: dashed;
          border-color: var(--line-strong);
          box-shadow: none;
          color: var(--fg-1);
        }

        .chip--clickable {
          cursor: pointer;
          transition:
            border-color 120ms ease,
            color 120ms ease,
            background 120ms ease;
        }

        .chip--clickable:hover {
          color: var(--fg-0);
        }

        .chip--selected {
          border-color: color-mix(in srgb, var(--accent) 45%, transparent);
          color: var(--accent);
          background-color: var(--accent-soft);
          box-shadow:
            inset 0 1px 0 var(--glass-edge),
            0 4px 12px -8px var(--accent);
        }

        .chip--clickable:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        .text {
          white-space: nowrap;
        }

        .remove {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          /* 24px keeps the tap target usable without inflating the chip. */
          width: 24px;
          height: 24px;
          padding: 0;
          border: none;
          border-radius: 50%;
          background: transparent;
          color: var(--fg-2);
          cursor: pointer;
        }

        .remove:hover {
          color: var(--accent-hot);
        }

        .remove:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 1px;
        }
      `}</style>
    </span>
  );
}
