import { useId } from "react";
import type { TextareaHTMLAttributes } from "react";

interface Props extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  label?: string;
  onValueChange?: (value: string) => void;
}

/** TextField's multi-line sibling: same label, border and focus treatment. */
export function TextArea({ label, onValueChange, id, className, rows = 3, ...rest }: Props) {
  const generatedId = useId();
  const areaId = id ?? generatedId;

  return (
    <div className={`field${className ? ` ${className}` : ""}`}>
      {label && (
        <label className="label" htmlFor={areaId}>
          {label}
        </label>
      )}
      <div className="control">
        <textarea
          id={areaId}
          className="input"
          rows={rows}
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
          display: flex;
        }

        .control .input {
          width: 100%;
          min-width: 0;
          padding: 10px 12px;
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
          font-size: 16px;
          line-height: 1.4;
          resize: vertical;
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
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
