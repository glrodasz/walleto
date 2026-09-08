import { useState } from "react";
import { Select } from "../atoms/Select";
import { TextField } from "../atoms/TextField";
import { Combobox } from "../atoms/Combobox";
import { Chip } from "../atoms/Chip";
import { Button } from "../atoms/Button";
import { paymentMethodOptionLabel } from "../../helpers/paymentMethodLabel";
import {
  CARD_TYPES,
  NETWORK_SUGGESTIONS,
  PAYMENT_METHOD_TYPE_OPTIONS,
  networkFieldLabel,
} from "../../helpers/paymentMethodOptions";
import type { PaymentMethodInput } from "../../schemas";
import type { PaymentMethod, PaymentMethodType } from "../../types";

interface Props {
  methods: PaymentMethod[];
  value: string;
  onChange: (paymentMethodId: string) => void;
  /** Resolves to the new method's id, which is selected immediately. */
  createMethod: (input: PaymentMethodInput) => Promise<string>;
  onError?: (message: string) => void;
  /** "None" is a valid choice for a payment; a recurring item may want it too. */
  allowNone?: boolean;
  disabled?: boolean;
}

interface Draft {
  type: PaymentMethodType | "";
  network: string;
  last4: string;
  name: string;
}

const EMPTY: Draft = { type: "", network: "", last4: "", name: "" };

/**
 * Payment method select with an inline "New method" creator, the CategoryField
 * pattern: the same fields as the wizard's step 2 (type, network or provider
 * where it applies, last 4 for cards, name), saved through the API and
 * selected on return.
 */
export function PaymentMethodField({
  methods,
  value,
  onChange,
  createMethod,
  onError,
  allowNone = true,
  disabled,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);

  const options = methods.map((m) => ({ value: m.id!, label: paymentMethodOptionLabel(m) }));
  const suggestions = draft.type ? NETWORK_SUGGESTIONS[draft.type] : undefined;
  const showNetwork = Boolean(suggestions);
  const showLast4 = draft.type ? CARD_TYPES.includes(draft.type) : false;

  const cancel = () => {
    setCreating(false);
    setDraft(EMPTY);
  };

  const save = async () => {
    if (!draft.type) return onError?.("Pick a method type");
    if (!draft.name.trim()) return onError?.("Give the method a name");
    setBusy(true);
    try {
      const id = await createMethod({
        name: draft.name.trim(),
        type: draft.type,
        ...(draft.network.trim() ? { network: draft.network.trim() } : {}),
        ...(draft.last4 && showLast4 ? { last4: draft.last4 } : {}),
      });
      onChange(id);
      cancel();
    } catch (err) {
      console.error("Failed to create payment method:", err);
      const text = err instanceof Error ? err.message : "";
      const parsed = (() => {
        try {
          return (JSON.parse(text) as { error?: unknown }).error;
        } catch {
          return undefined;
        }
      })();
      onError?.(typeof parsed === "string" ? parsed : "Couldn't create the payment method");
    } finally {
      setBusy(false);
    }
  };

  if (creating) {
    return (
      <div className="creator" role="group" aria-label="New payment method">
        <Select
          label="Type"
          placeholder="Select a type"
          options={PAYMENT_METHOD_TYPE_OPTIONS}
          value={draft.type}
          disabled={busy}
          onValueChange={(v) =>
            setDraft({ ...draft, type: v as PaymentMethodType, network: "", last4: "" })
          }
        />
        {showNetwork && draft.type && (
          <Combobox
            label={networkFieldLabel(draft.type)}
            fieldLabel={networkFieldLabel(draft.type)}
            placeholder="Search or type your own"
            suggestions={suggestions ?? []}
            value={draft.network}
            disabled={busy}
            onSelect={(network) => setDraft((d) => ({ ...d, network }))}
          />
        )}
        {showLast4 && (
          <TextField
            label="Last 4 numbers"
            placeholder="0000"
            inputMode="numeric"
            maxLength={4}
            value={draft.last4}
            disabled={busy}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, last4: v.replace(/\D/g, "").slice(0, 4) }))
            }
          />
        )}
        <TextField
          label="Method name"
          placeholder="Ex: Chase Sapphire"
          value={draft.name}
          disabled={busy}
          onValueChange={(name) => setDraft((d) => ({ ...d, name }))}
        />
        <div className="creator-actions">
          <Button variant="ghost" size="sm" onClick={cancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save method"}
          </Button>
        </div>

        <style jsx>{`
          .creator {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 12px;
            border: 1px dashed var(--line-strong);
            border-radius: var(--r-md);
          }

          .creator-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="method">
      <Select
        label="Payment method"
        placeholder={allowNone ? "None" : "Pick a method"}
        options={options}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
      />
      {!disabled && (
        <div className="method-add">
          <Chip variant="add" onClick={() => setCreating(true)}>
            New method
          </Chip>
        </div>
      )}

      <style jsx>{`
        .method {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .method-add {
          display: flex;
        }
      `}</style>
    </div>
  );
}
