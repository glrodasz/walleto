import { Select } from "../atoms/Select";
import { SELECTABLE_CURRENCIES, CURRENCY_SYMBOL } from "../../constants";
import type { Currency } from "../../types";

interface Props {
  value: Currency;
  onChange: (currency: Currency) => void;
}

/**
 * The mockup's "$ DOLAR" display-currency switcher. It changes the reporting
 * currency everywhere (persisted as users.displayCurrency), not the currency
 * of any stored record.
 */
export function CurrencySelector({ value, onChange }: Props) {
  return (
    <div className="selector">
      <Select
        aria-label="Display currency"
        options={SELECTABLE_CURRENCIES.map((c) => ({
          value: c.value,
          label: `${CURRENCY_SYMBOL[c.value]} ${c.label}`,
        }))}
        value={value}
        onValueChange={(v) => onChange(v as Currency)}
      />

      <style jsx>{`
        .selector {
          min-width: 110px;
        }
      `}</style>
    </div>
  );
}
