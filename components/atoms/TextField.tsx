import { useId } from "react";
import type { InputHTMLAttributes } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  /** Currency symbol or similar, pinned to the left edge. */
  prefix?: string;
  /** Right-align for money, so the value can never collide with the prefix. */
  align?: "left" | "right";
  onValueChange?: (value: string) => void;
}

export function TextField({
  label,
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
        {prefix && (
          <span className="prefix" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={`input${prefix ? " prefixed" : ""}${align === "right" ? " right" : ""}`}
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
          border: 1px solid var(--line);
          background: var(--bg-2);
          color: var(--fg-0);
          font-family: inherit;
          /* 16px avoids the iOS Safari zoom-on-focus behaviour */
          font-size: 16px;
        }

        .control .input.prefixed {
          /* Room for a 2-3 character symbol such as "kr" or "Fr". */
          padding-left: 38px;
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
          box-shadow: none;
        }

        .control .input:disabled {
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}
