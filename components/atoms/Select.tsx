import { useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "./Icons";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "children"> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  /**
   * Drop the field chrome — no fill, no rim, no blur — for a select that sits
   * inside another glass surface (the header's month pill). The flattening has
   * to live here: a parent's `:global(.select)` is (0,3,0) and loses to this
   * file's own `.control .select`, which is why the month pill kept showing a
   * second white pill inside itself.
   */
  flat?: boolean;
  onValueChange?: (value: string) => void;
}

export function Select({
  label,
  options,
  placeholder,
  flat = false,
  onValueChange,
  id,
  className,
  value,
  ...rest
}: Props) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={`field${className ? ` ${className}` : ""}`}>
      {label && (
        <label className="label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <div className="control">
        <select
          id={selectId}
          className={`select${flat ? " is-flat" : ""}`}
          value={value ?? ""}
          onChange={(e) => onValueChange?.(e.currentTarget.value)}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="chevron">
          <ChevronDown size={16} />
        </span>
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

        /* Scoped through .control so this beats the blanket select rule in
           globals.css, which also paints its own chevron background-image. */
        /* Scoped to beat globals.css, then re-states the same material so the
           control matches every other field. */
        .control .select {
          width: 100%;
          min-width: 0;
          height: 40px;
          padding: 0 34px 0 12px;
          border-radius: var(--r-md);
          border: 1px solid var(--glass-rim);
          background-color: var(--glass-field);
          background-image: none;
          backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
          -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
          box-shadow:
            inset 0 1px 2px rgba(15, 23, 42, 0.06),
            0 1px 0 var(--glass-edge);
          color: var(--fg-0);
          font-family: inherit;
          font-size: 16px;
          appearance: none;
          cursor: pointer;
        }

        /* One class more than the block above, so it wins whatever the order. */
        .control .select.is-flat {
          height: 34px;
          background-color: transparent;
          border-color: transparent;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          box-shadow: none;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .control .select.is-flat:focus {
          border-color: transparent;
          box-shadow: none;
        }

        .control .select:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-soft);
        }

        .control .select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chevron {
          position: absolute;
          right: 10px;
          display: inline-flex;
          color: var(--fg-2);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
