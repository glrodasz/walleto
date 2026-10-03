import type { ReactNode } from "react";

interface Props {
  /** What ticking it does, in a few words. */
  label: ReactNode;
  /** The consequence or the caveat, on its own line under the label. */
  hint?: ReactNode;
  /** A status pill under the hint ("Guessed from category") — always a `Badge`. */
  tag?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * A checkbox with its explanation. Every form option reads the same way: the
 * label on the first line, the helper message below it in small, quiet text,
 * and any status pill under that — never a "— …" tail glued to the label,
 * which wrapped mid-sentence and buried the option's own name.
 */
export function CheckboxField({ label, hint, tag, checked, onChange, disabled = false }: Props) {
  return (
    <label className={`checkbox${disabled ? " is-disabled" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      <span className="text">
        <span className="label">{label}</span>
        {hint && <span className="hint">{hint}</span>}
        {tag && <span className="tag">{tag}</span>}
      </span>

      <style jsx>{`
        .checkbox {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
        }

        .checkbox.is-disabled {
          cursor: default;
          opacity: 0.6;
        }

        input {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          margin: 2px 0 0;
          accent-color: var(--accent);
          cursor: inherit;
        }

        .text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          min-width: 0;
        }

        .label {
          font-size: 0.85rem;
          line-height: 1.35;
          color: var(--fg-0);
        }

        .hint {
          font-size: 0.75rem;
          line-height: 1.4;
          color: var(--fg-2);
        }

        .tag {
          margin-top: 4px;
        }
      `}</style>
    </label>
  );
}
