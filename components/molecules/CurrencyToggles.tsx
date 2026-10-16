import { Chip } from "../atoms/Chip";
import { CURRENCIES, CURRENCY_SYMBOL } from "../../constants";
import { useT } from "../../hooks/useT";
import { FIELD_MESSAGES } from "../../messages/fields";
import type { Currency } from "../../types";

interface Props {
  /** Currently offered by the pickers. */
  enabled: Currency[];
  /** Can't be turned off (main and display currency), with the reason. */
  locked: (currency: Currency) => string | null;
  onToggle: (currency: Currency) => void;
  disabled?: boolean;
}

/** The catalog as on/off chips: which currencies every picker offers. */
export function CurrencyToggles({ enabled, locked, onToggle, disabled = false }: Props) {
  const t = useT(FIELD_MESSAGES);
  return (
    <div className="toggles">
      <div className="chips" role="group" aria-label={t("currency.available")}>
        {CURRENCIES.map((c) => {
          const reason = locked(c);
          return (
            <Chip
              key={c}
              selected={enabled.includes(c)}
              disabled={disabled || Boolean(reason)}
              title={reason ?? undefined}
              onClick={() => onToggle(c)}
            >
              {`${CURRENCY_SYMBOL[c]} ${c}`}
            </Chip>
          );
        })}
      </div>

      <style jsx>{`
        .toggles {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 4px 0;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
