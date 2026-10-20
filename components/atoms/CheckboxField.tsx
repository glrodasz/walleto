import type { ReactNode } from "react";
import { InfoTip } from "./InfoTip";
import { useT } from "../../hooks/useT";
import { UI_MESSAGES } from "../../messages/ui";

interface Props {
  /** What ticking it does, in a few words. */
  label: ReactNode;
  /** The consequence or the caveat, on its own line under the label. */
  hint?: ReactNode;
  /**
   * Background that helps but isn't needed to decide — behind an "i" beside
   * the label instead of a line under it. A warning stays a `hint`.
   */
  info?: ReactNode;
  /** A status pill beside the label ("Guessed from category") — always a `Badge size="sm"`. */
  tag?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * A checkbox with its explanation. Every form option reads the same way: the
 * label on the first line with any status pill beside it, and the helper
 * message below in small, quiet text — never a "— …" tail glued to the
 * label, which wrapped mid-sentence and buried the option's own name.
 */
export function CheckboxField({
  label,
  hint,
  info,
  tag,
  checked,
  onChange,
  disabled = false,
}: Props) {
  const t = useT(UI_MESSAGES);
  return (
    <label className={`checkbox${disabled ? " is-disabled" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      <span className="text">
        <span className="head">
          <span className="label">{label}</span>
          {info && <InfoTip label={t("field.moreInfo")}>{info}</InfoTip>}
          {tag}
        </span>
        {hint && <span className="hint">{hint}</span>}
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

        .head {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
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
      `}</style>
    </label>
  );
}
