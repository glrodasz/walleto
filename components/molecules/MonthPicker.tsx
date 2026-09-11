import { Calendar, ChevronLeft, ChevronRight } from "../atoms/Icons";
import { Select } from "../atoms/Select";
import type { MonthWindow } from "../../features/domains/helpers/months";

interface Props {
  value: string;
  /** Oldest first, ending with the current month. */
  windows: MonthWindow[];
  onChange: (key: string) => void;
  onStep?: (delta: -1 | 1) => void;
}

/**
 * The header's "September 2026" control. Arrows step one month; the select
 * jumps. It never offers a month after the current one: the app reports on
 * what happened, and the future lives in the recurring plan.
 */
export function MonthPicker({ value, windows, onChange, onStep }: Props) {
  const index = windows.findIndex((w) => w.key === value);
  const atOldest = index <= 0;
  const atNewest = index === -1 || index === windows.length - 1;
  const step = (delta: -1 | 1) => {
    if (onStep) return onStep(delta);
    const next = windows[index + delta];
    if (next) onChange(next.key);
  };

  return (
    <div className="picker">
      <button
        type="button"
        className="arrow"
        aria-label="Previous month"
        onClick={() => step(-1)}
        disabled={atOldest}
      >
        <ChevronLeft size={16} />
      </button>
      <span className="icon" aria-hidden="true">
        <Calendar size={16} />
      </span>
      <div className="select">
        <Select
          aria-label="Month"
          options={[...windows].reverse().map((w) => ({ value: w.key, label: w.longLabel }))}
          value={value}
          onValueChange={onChange}
        />
      </div>
      <button
        type="button"
        className="arrow"
        aria-label="Next month"
        onClick={() => step(1)}
        disabled={atNewest}
      >
        <ChevronRight size={16} />
      </button>

      <style jsx>{`
        .picker {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 2px;
          border-radius: var(--r-md);
          border: 1px solid var(--line);
          background: var(--glass-strong);
          box-shadow: var(--shadow-sm);
        }

        .arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 34px;
          border: none;
          border-radius: var(--r-sm);
          background: transparent;
          color: var(--fg-2);
          cursor: pointer;
        }

        .arrow:hover:not(:disabled) {
          background: var(--bg-2);
          color: var(--fg-0);
        }

        .arrow:disabled {
          opacity: 0.35;
          cursor: default;
        }

        .icon {
          display: inline-flex;
          color: var(--fg-2);
          padding-left: 4px;
        }

        /* The select atom draws its own border; inside the picker it is flat. */
        .select {
          min-width: 150px;
        }

        .select :global(.select) {
          height: 34px;
          border-color: transparent;
          background: transparent;
          font-weight: 600;
          font-size: 0.875rem;
        }

        @media (max-width: 767px) {
          .select {
            min-width: 120px;
          }
        }
      `}</style>
    </div>
  );
}
