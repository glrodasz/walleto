import { useEffect, useState } from "react";
import { Modal } from "../../../components/molecules/Modal";
import { TextField } from "../../../components/atoms/TextField";
import { Button } from "../../../components/atoms/Button";
import { formatAmount } from "../../../components/atoms/Amount";
import { useInvestmentValuations } from "../../../hooks/useInvestmentValuations";
import { toDateInputValue } from "../../../helpers/scheduleAnchor";
import { gainFromValue, valueFromGain } from "../helpers/valuation";
import { CURRENCY_SYMBOL } from "../../../constants";
import type { Currency, InvestmentValuation } from "../../../types";

interface Props {
  open: boolean;
  categoryId: string;
  categoryName: string;
  /** What's been paid in so far, in `currency`. */
  costBasis: number;
  currency: Currency;
  /** Present = edit. */
  valuation?: InvestmentValuation;
  onClose: () => void;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Gain % and Value are two views of one number. Typing either recomputes the
 * other from the basis; whichever was edited last is what gets saved — so
 * "+100% → 260, but actually it's 230" is a two-keystroke correction.
 */
export function ValuationModal({
  open,
  categoryId,
  categoryName,
  costBasis,
  currency,
  valuation,
  onClose,
}: Props) {
  const { create, update } = useInvestmentValuations(categoryId);
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [gain, setGain] = useState("0");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (valuation) {
      setDate(toDateInputValue(valuation.asOf.toDate()));
      setGain(String(round2(valuation.gainPct)));
      setValue(String(round2(valuation.value)));
      setNote(valuation.note ?? "");
    } else {
      setDate(toDateInputValue(new Date()));
      setGain("0");
      setValue(String(round2(costBasis)));
      setNote("");
    }
  }, [open, valuation, costBasis]);

  const basis = valuation ? valuation.costBasis : costBasis;

  const onGainChange = (raw: string) => {
    setGain(raw);
    const pct = Number(raw);
    if (Number.isFinite(pct)) setValue(String(round2(valueFromGain(basis, pct))));
  };

  const onValueChange = (raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, "");
    setValue(cleaned);
    const v = Number(cleaned);
    const pct = gainFromValue(basis, v);
    if (Number.isFinite(v) && pct !== null) setGain(String(round2(pct)));
  };

  const submit = async () => {
    const v = Number(value);
    const pct = Number(gain);
    if (!(v >= 0) || !Number.isFinite(pct)) return setError("Enter a value or a gain %");
    if (!date) return setError("Pick a date");

    setBusy(true);
    setError(null);
    try {
      const [y, m, d] = date.split("-").map(Number);
      const asOf = new Date(y, m - 1, d, 12).toISOString();
      if (valuation?.id) {
        await update(valuation.id, { asOf, gainPct: pct, value: v, note: note.trim() || null });
      } else {
        await create({
          categoryId,
          asOf,
          gainPct: pct,
          value: v,
          costBasis: basis,
          currency,
          ...(note.trim() ? { note: note.trim() } : {}),
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to save valuation:", err);
      setError("Couldn't save — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={valuation ? `Edit valuation — ${categoryName}` : `Value ${categoryName}`}
      onClose={onClose}
    >
      <div className="form">
        <p className="basis">
          Invested so far: <strong>{formatAmount(basis, currency)}</strong>
        </p>

        <TextField label="As of" type="date" value={date} onValueChange={setDate} />

        <div className="pair">
          <TextField
            label="Gain %"
            inputMode="decimal"
            align="right"
            value={gain}
            onValueChange={(v) => onGainChange(v.replace(/[^\d.-]/g, ""))}
          />
          <TextField
            label="Current value"
            inputMode="decimal"
            prefix={CURRENCY_SYMBOL[currency]}
            align="right"
            value={value}
            onValueChange={onValueChange}
          />
        </div>
        <p className="hint">
          Type either one — the other follows. Override the value if your broker says otherwise.
        </p>

        <TextField
          label="Note (optional)"
          placeholder="e.g. Q2 statement"
          value={note}
          onValueChange={setNote}
        />

        {error && <p className="form-error">{error}</p>}

        <div className="actions">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : valuation ? "Save changes" : "Record"}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .basis {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .basis strong {
          color: var(--fg-0);
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
        }

        .pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .hint {
          margin: -6px 0 0;
          font-size: 0.78rem;
          color: var(--fg-2);
        }

        .form-error {
          margin: 0;
          font-size: 0.85rem;
          color: var(--accent-hot);
        }

        .actions {
          position: sticky;
          bottom: 0;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin: 4px -22px -22px;
          padding: 12px 22px 22px;
          background: var(--bg-1);
        }

        @media (max-width: 480px) {
          .pair {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Modal>
  );
}
