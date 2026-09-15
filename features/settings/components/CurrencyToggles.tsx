import { Chip } from "../../../components/atoms/Chip";
import { CURRENCIES, CURRENCY_SYMBOL } from "../../../constants";
import type { Currency } from "../../../types";

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
  return (
    <div className="toggles">
      <div className="chips" role="group" aria-label="Available currencies">
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
      <p className="note">
        Amounts already saved in a currency you turn off keep it — it just stops being offered for
        new ones.
      </p>

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

        .note {
          margin: 0;
          font-size: 0.75rem;
          color: var(--fg-2);
        }
      `}</style>
    </div>
  );
}
