import { Calendar, ChevronLeft, ChevronRight } from "../atoms/Icons";
import { formatDate } from "../../helpers/dates";
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
 *
 * The month is written as text and the native select lies invisibly on top
 * of it, so the pill is as wide as the month it names (a select is as wide as
 * its longest option) and can shorten it on phones — "Sep 2026" — with one
 * DOM for both widths. The step arrows already say it is a picker, so there
 * is no down arrow.
 */
export function MonthPicker({ value, windows, onChange, onStep }: Props) {
  const index = windows.findIndex((w) => w.key === value);
  const atOldest = index <= 0;
  const atNewest = index === -1 || index === windows.length - 1;
  const current = index === -1 ? null : windows[index];
  const step = (delta: -1 | 1) => {
    if (onStep) return onStep(delta);
    const next = windows[index + delta];
    if (next) onChange(next.key);
  };

  return (
    <div className="glass picker">
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
      <label className="month">
        <span className="text long" aria-hidden="true">
          {current?.longLabel ?? ""}
        </span>
        <span className="text short" aria-hidden="true">
          {current ? formatDate(current.start, "monthYear") : ""}
        </span>
        <select
          className="native"
          aria-label="Month"
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
        >
          {[...windows].reverse().map((w) => (
            <option key={w.key} value={w.key}>
              {w.longLabel}
            </option>
          ))}
        </select>
      </label>
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
          border-radius: var(--r-pill);
        }

        .arrow {
          display: inline-flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 34px;
          border: none;
          border-radius: var(--r-pill);
          background: transparent;
          color: var(--fg-2);
          cursor: pointer;
          transition:
            background 150ms ease,
            color 150ms ease;
        }

        .arrow:hover:not(:disabled) {
          background: var(--glass-hover);
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

        .month {
          position: relative;
          display: inline-flex;
          align-items: center;
          height: 34px;
          padding: 0 8px;
          border-radius: var(--r-pill);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--fg-0);
          white-space: nowrap;
          cursor: pointer;
          transition: background 150ms ease;
        }

        .month:hover {
          background: var(--glass-hover);
        }

        /* The select is invisible, so its keyboard focus shows on the label. */
        .month:focus-within {
          box-shadow: 0 0 0 2px var(--accent);
        }

        .short {
          display: none;
        }

        /* Invisible, but it is the control: it takes the taps, the keyboard
           and the screen reader, and opens the native month list. Two classes
           deep to beat the blanket select rule in globals.css. */
        .month .native {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          min-width: 0;
          margin: 0;
          padding: 0;
          border: none;
          box-shadow: none;
          background: transparent;
          opacity: 0;
          cursor: pointer;
          font-size: 16px;
        }

        /* Phones: the short month and no calendar glyph, so the picker shares
           a row with the privacy and currency pills. */
        @media (max-width: 767px) {
          .icon {
            display: none;
          }

          .long {
            display: none;
          }

          .short {
            display: inline;
          }

          .arrow {
            width: 28px;
          }
        }
      `}</style>
    </div>
  );
}
