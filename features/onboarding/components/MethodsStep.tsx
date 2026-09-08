import { Select } from "../../../components/atoms/Select";
import { TextField } from "../../../components/atoms/TextField";
import { Combobox } from "../../../components/atoms/Combobox";
import { Chip } from "../../../components/atoms/Chip";
import { Close } from "../../../components/atoms/Icons";
import { useMethodsStep } from "../hooks/useMethodsStep";
import {
  CARD_TYPES,
  NETWORK_SUGGESTIONS,
  PAYMENT_METHOD_TYPE_OPTIONS,
  networkFieldLabel,
} from "../../../helpers/paymentMethodOptions";
import type { PaymentMethodType } from "../../../types";

interface Props {
  state: ReturnType<typeof useMethodsStep>;
}

export function MethodsStep({ state }: Props) {
  const { rows, add, update, removeAt } = state;

  return (
    <div className="rows">
      {rows.map((row, i) => {
        const { type } = row;
        const networkSuggestions = type ? NETWORK_SUGGESTIONS[type] : undefined;
        const showNetwork = Boolean(networkSuggestions);
        const showLast4 = type ? CARD_TYPES.includes(type) : false;
        const disabled = Boolean(row.id);
        const networkLabel = type ? networkFieldLabel(type) : "";

        // Type + Name always show; Network and Last 4 are conditional, so the
        // row spans 2 to 4 columns depending on the picked type.
        const fieldsClass =
          showNetwork && showLast4
            ? "fields fields--wide"
            : showNetwork
              ? "fields"
              : "fields fields--narrow";

        return (
          <div key={row.key} className={`row${i > 0 ? " row--divided" : ""}`}>
            <div className={fieldsClass}>
              <Select
                label="Type"
                placeholder="Select a type"
                options={PAYMENT_METHOD_TYPE_OPTIONS}
                value={type}
                disabled={disabled}
                onValueChange={(value) =>
                  update(row.key, { type: value as PaymentMethodType, network: "", last4: "" })
                }
              />

              {showNetwork && (
                <Combobox
                  label={networkLabel}
                  fieldLabel={networkLabel}
                  placeholder="Search or type your own"
                  suggestions={networkSuggestions ?? []}
                  value={row.network}
                  disabled={disabled}
                  onSelect={(value) => update(row.key, { network: value })}
                />
              )}

              {showLast4 && (
                <TextField
                  label="Last 4 numbers"
                  placeholder="0000"
                  inputMode="numeric"
                  maxLength={4}
                  value={row.last4}
                  disabled={disabled}
                  onValueChange={(value) =>
                    update(row.key, { last4: value.replace(/\D/g, "").slice(0, 4) })
                  }
                />
              )}

              <TextField
                label="Name"
                placeholder="Ex: Chase Sapphire"
                value={row.name}
                disabled={disabled}
                onValueChange={(value) => update(row.key, { name: value })}
              />
            </div>

            {rows.length > 1 && (
              <button
                type="button"
                className="remove"
                onClick={() => removeAt(row.key)}
                aria-label={`Remove ${row.name || "payment method"}`}
              >
                <Close size={20} />
              </button>
            )}
          </div>
        );
      })}

      <div>
        <Chip variant="add" onClick={add}>
          Add more
        </Chip>
      </div>

      <style jsx>{`
        .rows {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .row {
          display: flex;
          align-items: flex-end;
          gap: 12px;
        }

        .row--divided {
          border-top: 1px solid var(--line);
          padding-top: 20px;
        }

        /* Default: Type + Network/Provider + Name (Digital wallet). */
        .fields {
          flex: 1;
          min-width: 0;
          display: grid;
          grid-template-columns: 1.4fr 1.2fr 1.4fr;
          gap: 12px;
        }

        /* Type + Network + Last 4 + Name (Credit/Debit card). */
        .fields--wide {
          grid-template-columns: 1.3fr 1.1fr 0.8fr 1.3fr;
        }

        /* Type + Name only (Bank transfer, Cash, Crypto wallet, Other). */
        .fields--narrow {
          grid-template-columns: 1fr 1.5fr;
        }

        .remove {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          padding: 0;
          border: none;
          border-radius: var(--r-md);
          background: transparent;
          color: var(--fg-2);
          cursor: pointer;
        }

        .remove:hover {
          color: var(--accent-hot);
          background: var(--bg-2);
        }

        .remove:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        @media (max-width: 767px) {
          .fields,
          .fields--wide,
          .fields--narrow {
            grid-template-columns: 1fr;
          }

          .row {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
