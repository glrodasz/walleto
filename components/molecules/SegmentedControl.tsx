import type { ComponentType } from "react";
import type { IconProps } from "../atoms/Icons";

export interface SegmentOption<K extends string> {
  key: K;
  label: string;
  icon?: ComponentType<IconProps>;
}

interface Props<K extends string> {
  options: SegmentOption<K>[];
  value: K;
  onChange: (key: K) => void;
  /** Accessible name of the group ("Theme", "Stack bars by"). */
  label: string;
  size?: "sm" | "md";
}

/**
 * A row of mutually exclusive choices — Light / Dark / System, Category /
 * Currency. Radios under the hood, so arrow keys and screen readers work.
 */
export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
}: Props<K>) {
  return (
    <div className={`segments segments--${size}`} role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const Icon = o.icon;
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={active}
            className={`segment${active ? " is-active" : ""}`}
            onClick={() => onChange(o.key)}
          >
            {Icon && <Icon size={size === "sm" ? 14 : 16} />}
            <span>{o.label}</span>
          </button>
        );
      })}
      <style jsx>{`
        .segments {
          display: inline-flex;
          gap: 2px;
          padding: 3px;
          border-radius: var(--r-md);
          border: 1px solid var(--line);
          background: var(--bg-2);
        }

        .segment {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex: 1;
          border: none;
          border-radius: var(--r-sm);
          background: transparent;
          color: var(--fg-1);
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition:
            background 0.15s,
            color 0.15s;
        }

        .segments--md .segment {
          min-height: 34px;
          padding: 0 14px;
          font-size: 0.85rem;
        }

        .segments--sm .segment {
          min-height: 28px;
          padding: 0 10px;
          font-size: 0.75rem;
        }

        .segment:hover {
          color: var(--fg-0);
        }

        .segment.is-active {
          background: var(--bg-1);
          color: var(--accent);
          box-shadow: var(--shadow-sm);
        }
      `}</style>
    </div>
  );
}
