import { useEffect, useState } from "react";
import { Modal } from "../../../components/molecules/Modal";
import { TextField } from "../../../components/atoms/TextField";
import { Combobox } from "../../../components/atoms/Combobox";
import { Select } from "../../../components/atoms/Select";
import { Button } from "../../../components/atoms/Button";
import { usePaymentMethods } from "../../../hooks/usePaymentMethods";
import {
  CARD_TYPES,
  NETWORK_SUGGESTIONS,
  networkFieldLabel,
} from "../../../helpers/paymentMethodOptions";
import { SELECTABLE_CURRENCIES, CURRENCY_SYMBOL } from "../../../constants";
import type { Currency, PaymentMethod } from "../../../types";

const CURRENCY_OPTIONS = SELECTABLE_CURRENCIES.map((c) => ({
  value: c.value,
  label: `${CURRENCY_SYMBOL[c.value]} ${c.label}`,
}));

interface Props {
  method: PaymentMethod | null;
  onClose: () => void;
}

/**
 * The wizard's MethodsStep locks a row's type/network/last4 once it's saved
 * (by design — swapping a card's type mid-flow doesn't make sense there), so
 * this page needs its own path to the fields that genuinely are safe to
 * change after creation: display name, default reporting currency, and — for
 * cards — the network and last 4 digits (a nickname or the last 4 changing
 * doesn't invalidate anything that already points at this method's id).
 */
export function EditMethodModal({ method, onClose }: Props) {
  const { update } = usePaymentMethods();
  const [name, setName] = useState("");
  const [network, setNetwork] = useState("");
  const [last4, setLast4] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState<Currency | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!method) return;
    setName(method.name);
    setNetwork(method.network ?? "");
    setLast4(method.last4 ?? "");
    setDefaultCurrency(method.defaultCurrency ?? "");
    setError(null);
  }, [method]);

  if (!method) return null;

  const networkSuggestions = NETWORK_SUGGESTIONS[method.type];
  const showNetwork = Boolean(networkSuggestions);
  const showLast4 = CARD_TYPES.includes(method.type);

  const submit = async () => {
    if (!name.trim()) return setError("Give it a name");
    setBusy(true);
    setError(null);
    try {
      await update(method.id!, {
        name: name.trim(),
        ...(showNetwork ? { network: network.trim() } : {}),
        ...(showLast4 ? { last4 } : {}),
        ...(defaultCurrency ? { defaultCurrency } : {}),
      });
      onClose();
    } catch (err) {
      console.error("Failed to update payment method:", err);
      setError("Couldn't save — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open title={`Edit ${method.name}`} onClose={onClose}>
      <div className="form">
        <TextField
          label="Alias"
          placeholder="Ex: Chase Sapphire"
          value={name}
          onValueChange={setName}
        />

        {showNetwork && (
          <Combobox
            label={networkFieldLabel(method.type)}
            fieldLabel={networkFieldLabel(method.type)}
            placeholder="Search or type your own"
            suggestions={networkSuggestions ?? []}
            value={network}
            onSelect={setNetwork}
          />
        )}

        {showLast4 && (
          <TextField
            label="Last 4 numbers"
            placeholder="0000"
            inputMode="numeric"
            maxLength={4}
            value={last4}
            onValueChange={(v) => setLast4(v.replace(/\D/g, "").slice(0, 4))}
          />
        )}

        <Select
          label="Default currency"
          placeholder="None"
          options={CURRENCY_OPTIONS}
          value={defaultCurrency}
          onValueChange={(v) => setDefaultCurrency(v as Currency)}
        />

        {error && <p className="form-error">{error}</p>}

        <div className="actions">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .form-error {
          margin: 0;
          font-size: 0.85rem;
          color: var(--accent-hot);
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 4px;
        }
      `}</style>
    </Modal>
  );
}
