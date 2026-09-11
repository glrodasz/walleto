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
      <h2 className="heading">Select your main currency</h2>
      <div className="chips" role="group" aria-label="Main currency">
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

        .heading {
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--fg-1);
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
