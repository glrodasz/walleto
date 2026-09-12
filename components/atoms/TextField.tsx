import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  /**
   * A glyph pinned to the left edge — a magnifier on a search box. The room for
   * it has to be made here: a caller's own `:global(input) { padding-left }` is
   * (0,2,1) and loses to this file's `.control .input`, which is exactly how the
   * search icon ended up sitting on top of its own placeholder.
   */
  icon?: ReactNode;
  /** Currency symbol or similar, pinned to the left edge. */
  prefix?: string;
  /** Right-align for money, so the value can never collide with the prefix. */
  align?: "left" | "right";
  onValueChange?: (value: string) => void;
}

export function TextField({
  label,
  icon,
  prefix,
  align = "left",
  onValueChange,
  id,
  className,
  ...rest
}: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`field${className ? ` ${className}` : ""}`}>
      {label && (
        <label className="label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="control">
        {icon && (
          <span className="icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {prefix && (
          <span className="prefix" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={`input${icon ? " with-icon" : ""}${prefix ? " prefixed" : ""}${
            align === "right" ? " right" : ""
          }`}
          onChange={(e) => onValueChange?.(e.currentTarget.value)}
          {...rest}
        />
      </div>

      <style jsx>{`
        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .label {
          font-size: 0.8125rem;
          color: var(--fg-1);
        }

        .control {
          position: relative;
          display: flex;
          align-items: center;
        }

        .icon {
          position: absolute;
          left: 12px;
          display: inline-flex;
          color: var(--fg-2);
          pointer-events: none;
        }

        .prefix {
          position: absolute;
          left: 12px;
          font-size: 0.875rem;
          color: var(--fg-2);
          pointer-events: none;
        }

        /* Scoped through .control so this beats the blanket
           input:not([type="checkbox"]):not([type="radio"]) rule in globals.css,
           which is more specific than a bare .input class would be. */
        .control .input {
          width: 100%;
          min-width: 0;
          height: 40px;
          padding: 0 12px;
          border-radius: var(--r-md);
          border: 1px solid var(--glass-rim);
          background-color: var(--glass-field);
          backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
          -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
          box-shadow:
            inset 0 1px 2px rgba(15, 23, 42, 0.06),
            0 1px 0 var(--glass-edge);
          color: var(--fg-0);
          font-family: inherit;
          /* 16px avoids the iOS Safari zoom-on-focus behaviour */
          font-size: 16px;
        }

        .control .input.prefixed {
          /* Room for a 2-3 character symbol such as "kr" or "Fr". */
          padding-left: 38px;
        }

        .control .input.with-icon {
          /* 12px gutter + a 16px glyph + 8px of air. */
          padding-left: 36px;
        }

        .control .input.right {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .control .input::placeholder {
          color: var(--fg-2);
        }

        .control .input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-soft);
        }

        .control .input:disabled {
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}
