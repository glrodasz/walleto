import { Chip } from "../../../components/atoms/Chip";
import { SELECTABLE_CURRENCIES } from "../../../constants";
import type { Currency } from "../../../types";

interface Props {
  value: Currency;
  onChange: (currency: Currency) => void;
}

export function CurrencyPicker({ value, onChange }: Props) {
  return (
    <section className="picker">
      <header className="head">
        <h2 className="heading">Your currency</h2>
        <p className="hint">
          Totals are shown in it and new entries start in it. The switcher in the header shows
          totals in another currency anytime.
        </p>
      </header>
      <div className="chips" role="group" aria-label="Your currency">
        {SELECTABLE_CURRENCIES.map((c) => (
          <Chip key={c.value} selected={c.value === value} onClick={() => onChange(c.value)}>
            {c.label}
          </Chip>
        ))}
      </div>

      <style jsx>{`
        .picker {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-bottom: 28px;
          border-bottom: 1px solid var(--line);
        }

        .head {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .heading {
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--fg-1);
        }

        .hint {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--fg-2);
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      `}</style>
    </section>
  );
}
