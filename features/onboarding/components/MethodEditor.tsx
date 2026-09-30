import { Select } from "../../../components/atoms/Select";
import { TextField } from "../../../components/atoms/TextField";
import { Combobox } from "../../../components/atoms/Combobox";
import { Button } from "../../../components/atoms/Button";
import { Last4Field } from "../../../components/molecules/Last4Field";
import { Trash } from "../../../components/atoms/Icons";
import {
  CARD_TYPES,
  NETWORK_SUGGESTIONS,
  PAYMENT_METHOD_TYPE_OPTIONS,
  networkFieldLabel,
} from "../../../helpers/paymentMethodOptions";
import type { MethodRow } from "../hooks/useMethodsStep";
import type { PaymentMethodType } from "../../../types";

interface Props {
  id: string;
  row: MethodRow;
  /** A save failed: show every field's error without waiting for a blur. */
  attempted: boolean;
  /** The row's own problem after a failed save (a cleared alias). */
  problem: string | null;
  canRemove: boolean;
  onChange: (patch: Partial<MethodRow>) => void;
  onRemove: () => void;
  onDone: () => void;
}

/**
 * The fields of one open wallet item, at full width. Remove lives in the
 * footer rather than in a column beside the fields, which cost every field
 * its width on a phone.
 */
export function MethodEditor({
  id,
  row,
  attempted,
  problem,
  canRemove,
  onChange,
  onRemove,
  onDone,
}: Props) {
  const { type } = row;
  const networkSuggestions = type ? NETWORK_SUGGESTIONS[type] : undefined;
  const showLast4 = type ? CARD_TYPES.includes(type) : false;
  const saved = Boolean(row.id);
  const networkLabel = type ? networkFieldLabel(type) : "";
  const aliasProblem = problem && !row.name.trim() ? problem : null;

  return (
    <div className="editor" id={id}>
      <div className="fields">
        {/* A saved method's type is fixed: plan items already point at it. */}
        <Select
          label="Type"
          placeholder="Select a type"
          options={PAYMENT_METHOD_TYPE_OPTIONS}
          value={type}
          disabled={saved}
          onValueChange={(value) =>
            onChange({ type: value as PaymentMethodType, network: "", last4: "" })
          }
        />

        {networkSuggestions && (
          <Combobox
            label={networkLabel}
            fieldLabel={networkLabel}
            placeholder="Search or type your own"
            suggestions={networkSuggestions}
            value={row.network}
            onSelect={(value) => onChange({ network: value })}
          />
        )}

        {showLast4 && (
          <Last4Field
            value={row.last4}
            showError={attempted}
            onChange={(last4) => onChange({ last4 })}
          />
        )}

        <div className="alias">
          <TextField
            label="Alias"
            placeholder="Ex: Chase Sapphire"
            value={row.name}
            aria-invalid={aliasProblem ? true : undefined}
            onValueChange={(value) => onChange({ name: value })}
          />
          {aliasProblem && <p className="error">{aliasProblem}</p>}
        </div>
      </div>

      <div className="footer">
        {canRemove && (
          <Button variant="ghost" size="sm" className="remove" onClick={onRemove}>
            <Trash size={16} />
            Remove
          </Button>
        )}
        <Button variant="secondary" size="sm" className="done" onClick={onDone}>
          Done
        </Button>
      </div>

      <style jsx>{`
        .editor {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }

        .fields {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .alias {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .error {
          margin: 0;
          font-size: 0.72rem;
          color: var(--accent-hot);
        }

        .footer {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Button is a child component: its className needs :global(). */
        .footer :global(.remove) {
          color: var(--accent-hot);
        }

        .footer :global(.done) {
          margin-left: auto;
        }
      `}</style>
    </div>
  );
}
