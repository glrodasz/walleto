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
  onValueChange?: (value: string) => void;
}

export function Select({
  label,
  options,
  placeholder,
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
          className="select"
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
        .control .select {
          width: 100%;
          min-width: 0;
          height: 40px;
          padding: 0 34px 0 12px;
          border-radius: var(--r-md);
          border: 1px solid var(--line);
          background: var(--bg-2);
          background-image: none;
          color: var(--fg-0);
          font-family: inherit;
          font-size: 16px;
          appearance: none;
          cursor: pointer;
        }

        .control .select:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: none;
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
