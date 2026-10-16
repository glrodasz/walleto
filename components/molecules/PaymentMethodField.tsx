import { useState } from "react";
import { Select } from "../atoms/Select";
import { TextField } from "../atoms/TextField";
import { Combobox } from "../atoms/Combobox";
import { Chip } from "../atoms/Chip";
import { Button } from "../atoms/Button";
import { Last4Field } from "./Last4Field";
import { paymentMethodOptionLabel } from "../../helpers/paymentMethodLabel";
import {
  CARD_TYPES,
  NETWORK_SUGGESTIONS,
  last4Error,
  networkFieldLabel,
  paymentMethodTypeOptions,
  sortByName,
} from "../../helpers/paymentMethodOptions";
import { errorMessage } from "../../utils/errorMessage";
import { usePreferences } from "../../hooks/usePreferences";
import { useT } from "../../hooks/useT";
import { COMMON_MESSAGES } from "../../messages/common";
import { FIELD_MESSAGES } from "../../messages/fields";
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
  const { language } = usePreferences();
  const t = useT(FIELD_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const options = sortByName(methods).map((m) => ({
    value: m.id!,
    label: paymentMethodOptionLabel(m, language),
  }));
  const suggestions = draft.type ? NETWORK_SUGGESTIONS[draft.type] : undefined;
  const showNetwork = Boolean(suggestions);
  const showLast4 = draft.type ? CARD_TYPES.includes(draft.type) : false;

  const cancel = () => {
    setCreating(false);
    setDraft(EMPTY);
    setAttempted(false);
  };

  const save = async () => {
    if (!draft.type) return onError?.(t("method.pickType"));
    if (!draft.name.trim()) return onError?.(t("method.nameRequired"));
    const last4Problem = showLast4 ? last4Error(draft.last4, language) : null;
    if (last4Problem) {
      setAttempted(true);
      return onError?.(last4Problem);
    }
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
      onError?.(errorMessage(err, t("method.createFailed")));
    } finally {
      setBusy(false);
    }
  };

  if (creating) {
    return (
      <div className="creator" role="group" aria-label={t("method.new")}>
        <Select
          label={t("method.type")}
          placeholder={t("method.selectType")}
          options={paymentMethodTypeOptions(language)}
          value={draft.type}
          disabled={busy}
          onValueChange={(v) =>
            setDraft({ ...draft, type: v as PaymentMethodType, network: "", last4: "" })
          }
        />
        {showNetwork && draft.type && (
          <Combobox
            label={networkFieldLabel(draft.type, language)}
            fieldLabel={networkFieldLabel(draft.type, language)}
            placeholder={t("method.searchOrType")}
            suggestions={suggestions ?? []}
            value={draft.network}
            disabled={busy}
            onSelect={(network) => setDraft((d) => ({ ...d, network }))}
          />
        )}
        {showLast4 && (
          <Last4Field
            value={draft.last4}
            disabled={busy}
            showError={attempted}
            onChange={(last4) => setDraft((d) => ({ ...d, last4 }))}
          />
        )}
        <TextField
          label={t("method.alias")}
          placeholder={t("method.aliasPlaceholder")}
          value={draft.name}
          disabled={busy}
          onValueChange={(name) => setDraft((d) => ({ ...d, name }))}
        />
        <div className="creator-actions">
          <Button variant="ghost" size="sm" onClick={cancel} disabled={busy}>
            {tc("action.cancel")}
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={busy}>
            {busy ? tc("action.saving") : t("method.save")}
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
        label={tc("noun.paymentMethod")}
        placeholder={allowNone ? tc("state.none") : t("method.pick")}
        options={options}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
      />
      {!disabled && (
        <div className="method-add">
          <Chip variant="add" onClick={() => setCreating(true)}>
            {t("method.newShort")}
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
