import { useState } from "react";
import { Modal } from "../../../components/molecules/Modal";
import { TextField } from "../../../components/atoms/TextField";
import { Button } from "../../../components/atoms/Button";
import { CURRENCY_SYMBOL } from "../../../constants";
import { toDate } from "../../../helpers/chartData";
import { updateTransaction } from "../../../hooks/useTransactions";
import { useDecimalInput } from "../../../hooks/useDecimalInput";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useDateFormat } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import { errorMessage } from "../../../utils/errorMessage";
import { COMMON_MESSAGES } from "../../../messages/common";
import { DOMAIN_MESSAGES } from "../messages";
import type { Transaction } from "../../../types";

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

/**
 * Turns a variable row's band into what was really spent. Dropping the floor
 * is what confirms it (the route stamps `confirmedAt`); the row's date stays,
 * so the money keeps belonging to the period it was planned for. An amount
 * outside the band is fine: the band was a guess.
 */
export function ConfirmAmountModal({ transaction: tx, onClose }: Props) {
  const t = useT(DOMAIN_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  const decimal = useDecimalInput();
  const { formatNativeRange } = useMoneyFormat();
  const { formatDate } = useDateFormat();
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const range =
    tx.amountFloor !== undefined
      ? formatNativeRange(tx.amountFloor, tx.amount, tx.currency, tx.currency)
      : "";

  const submit = async () => {
    const amount = decimal.parse(raw);
    if (amount === null || !(amount > 0)) {
      setError(t("confirm.error"));
      return;
    }
    if (!tx.id) return;
    setError(null);
    setSaving(true);
    try {
      await updateTransaction(tx.id, { amount, amountFloor: null });
      onClose();
    } catch (err) {
      setError(errorMessage(err, t("confirm.failed", { name: tx.name })));
      setSaving(false);
    }
  };

  return (
    <Modal open title={t("confirm.title", { name: tx.name })} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <p className="planned">
          {t("confirm.planned", {
            range,
            period: formatDate(toDate(tx.occurredAt), "monthLong"),
          })}
        </p>
        <TextField
          label={t("confirm.amount")}
          placeholder="0"
          inputMode="decimal"
          prefix={CURRENCY_SYMBOL[tx.currency]}
          align="right"
          autoFocus
          value={raw}
          onValueChange={(v) => setRaw(decimal.sanitize(v))}
        />
        {error && <p className="form-error">{error}</p>}
        <div className="actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tc("action.cancel")}
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {t("confirm.save")}
          </Button>
        </div>
      </form>

      <style jsx>{`
        .form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .planned {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
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
        }
      `}</style>
    </Modal>
  );
}
