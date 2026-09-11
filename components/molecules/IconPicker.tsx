import { ICON_KEYS } from "../../constants";
import { CATEGORY_ICONS } from "../atoms/CategoryIcon";
import type { IconKey } from "../../types";

interface Props {
  value?: IconKey;
  onChange: (icon: IconKey) => void;
  label?: string;
  disabled?: boolean;
}

/** The curated icon grid a category can pick from. Radios, so it is keyboardable. */
export function IconPicker({ value, onChange, label = "Icon", disabled }: Props) {
  return (
    <div className="grid" role="radiogroup" aria-label={label}>
      {ICON_KEYS.map((key) => {
        const Icon = CATEGORY_ICONS[key];
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={key}
            title={key}
            disabled={disabled}
            className={`cell${active ? " is-active" : ""}`}
            onClick={() => onChange(key)}
          >
            <Icon size={18} />
          </button>
        );
      })}
      <style jsx>{`
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
          gap: 6px;
        }

        .cell {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 40px;
          border: 1px solid var(--glass-rim);
          border-radius: var(--r-md);
          background: var(--glass-inset);
          color: var(--fg-1);
          cursor: pointer;
          transition:
            border-color 0.15s,
            color 0.15s,
            background 0.15s;
        }

        .cell:hover:not(:disabled) {
          color: var(--fg-0);
          border-color: var(--line-strong);
        }

        .cell.is-active {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--accent-soft);
        }

        .cell:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
