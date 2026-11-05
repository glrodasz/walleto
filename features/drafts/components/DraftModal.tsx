import { useEffect, useState } from "react";
import { Modal } from "../../../components/molecules/Modal";
import { SegmentedControl } from "../../../components/molecules/SegmentedControl";
import { TextField } from "../../../components/atoms/TextField";
import { Select } from "../../../components/atoms/Select";
import { Button } from "../../../components/atoms/Button";
import { CURRENCY_SYMBOL } from "../../../constants";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { useEnabledCurrencies } from "../../../hooks/useEnabledCurrencies";
import { useDecimalInput } from "../../../hooks/useDecimalInput";
import { useT } from "../../../hooks/useT";
import { COMMON_MESSAGES } from "../../../messages/common";
import { DRAFT_MESSAGES } from "../messages";
import { createDraft } from "../hooks/useExpenseDrafts";
import type { Currency, DraftFrequency } from "../../../types";

type Cadence = DraftFrequency | "LATER";

const CADENCES: Cadence[] = ["MONTHLY", "YEARLY", "ONE_TIME", "LATER"];

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * The thirty-second version of "Add expense": a name, and if known an
 * amount, how often and when. Everything but the name can wait for
 * "Turn into expense", which opens the full form with these filled in.
 */
export function DraftModal({ open, onClose }: Props) {
  const t = useT(DRAFT_MESSAGES);
  const common = useT(COMMON_MESSAGES);
  const decimal = useDecimalInput();
  const { userDoc } = useUserDoc();
  const { optionsFor } = useEnabledCurrencies();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency | "">("");
  const [cadence, setCadence] = useState<Cadence>("LATER");
  const [day, setDay] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setAmount("");
    setCurrency("");
    setCadence("LATER");
    setDay("");
    setDate("");
    setError(null);
  }, [open]);

  const effectiveCurrency: Currency = currency || userDoc?.mainCurrency || "USD";

  const submit = async () => {
    if (!name.trim()) return setError(t("modal.error.name"));
    const parsed = decimal.parse(amount);
    const frequency = cadence === "LATER" ? undefined : cadence;
    setBusy(true);
    setError(null);
    try {
      await createDraft({
        name: name.trim(),
        ...(parsed !== null && parsed > 0 ? { amount: parsed, currency: effectiveCurrency } : {}),
        ...(frequency ? { frequency } : {}),
        ...(frequency === "MONTHLY" && day ? { dayOfMonth: Number(day) } : {}),
        ...(frequency && frequency !== "MONTHLY" && date ? { date } : {}),
      });
      onClose();
    } catch (err) {
      console.error("Failed to save draft:", err);
      setError(t("modal.error.save"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={t("modal.title")} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <TextField
          label={t("modal.name")}
          hint={t("modal.info")}
          placeholder={t("modal.namePlaceholder")}
          value={name}
          autoFocus
          onValueChange={setName}
        />

        <div className="pair">
          <TextField
            label={t("modal.amount")}
            placeholder="0"
            inputMode="decimal"
            prefix={CURRENCY_SYMBOL[effectiveCurrency]}
            align="right"
            value={amount}
            onValueChange={(v) => setAmount(decimal.sanitize(v))}
          />
          <Select
            label={common("noun.currency")}
            options={optionsFor(effectiveCurrency)}
            value={effectiveCurrency}
            onValueChange={(v) => setCurrency(v as Currency)}
          />
        </div>

        <div className="cadence">
          <span className="label">{t("modal.frequency")}</span>
          <SegmentedControl<Cadence>
            label={t("modal.frequency")}
            size="sm"
            options={CADENCES.map((c) => ({
              key: c,
              label: c === "LATER" ? t("modal.later") : common(`frequency.${c}`),
            }))}
            value={cadence}
            onChange={setCadence}
          />
        </div>

        {cadence === "MONTHLY" && (
          <Select
            label={t("modal.day")}
            options={[{ value: "", label: t("modal.noDay") }, ...DAY_OPTIONS]}
            value={day}
            onValueChange={setDay}
          />
        )}
        {(cadence === "YEARLY" || cadence === "ONE_TIME") && (
          <TextField label={t("modal.date")} type="date" value={date} onValueChange={setDate} />
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="actions">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {common("action.cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={busy}>
            {busy ? common("action.saving") : t("modal.save")}
          </Button>
        </div>
      </form>

      <style jsx>{`
        .form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .cadence {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .label {
          font-size: 0.8125rem;
          color: var(--fg-1);
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
