import { Select } from "../atoms/Select";
import { useEnabledCurrencies } from "../../hooks/useEnabledCurrencies";
import { useT } from "../../hooks/useT";
import { FIELD_MESSAGES } from "../../messages/fields";
import type { Currency } from "../../types";

interface Props {
  value: Currency;
  onChange: (currency: Currency) => void;
}

/**
 * The mockup's "$ DOLAR" display-currency switcher. It changes the reporting
 * currency everywhere (persisted as users.displayCurrency), not the currency
 * of any stored record. It offers the currencies enabled in Settings.
 */
export function CurrencySelector({ value, onChange }: Props) {
  const { optionsFor } = useEnabledCurrencies();
  const t = useT(FIELD_MESSAGES);

  return (
    <div className="selector">
      <Select
        aria-label={t("currency.display")}
        options={optionsFor(value)}
        value={value}
        onValueChange={(v) => onChange(v as Currency)}
      />

      <style jsx>{`
        .selector {
          min-width: 110px;
        }

        /* "kr SEK" fits in less; the room goes to the month picker beside it. */
        @media (max-width: 767px) {
          .selector {
            min-width: 96px;
          }
        }
      `}</style>
    </div>
  );
}
