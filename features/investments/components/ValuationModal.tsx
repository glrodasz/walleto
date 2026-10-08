import { useEffect, useState } from "react";
import { Modal } from "../../../components/molecules/Modal";
import { TextField } from "../../../components/atoms/TextField";
import { Select } from "../../../components/atoms/Select";
import { Button } from "../../../components/atoms/Button";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { useEnabledCurrencies } from "../../../hooks/useEnabledCurrencies";
import { useDecimalInput } from "../../../hooks/useDecimalInput";
import { roundTo } from "../../../utils/decimal";
import {
  createInvestmentValuation,
  updateInvestmentValuation,
} from "../../../hooks/useInvestmentValuations";
import { toDateInputValue } from "../../../helpers/scheduleAnchor";
import { convert } from "../../../helpers/fx";
import { ACCOUNT_NOUN } from "../../../helpers/accounts";
import { gainFromValue, valueFromGain } from "../helpers/valuation";
import type { ValueSelector } from "../helpers/valuation";
import { CURRENCY_SYMBOL } from "../../../constants";
import type { AccountDomain, Category, Currency, InvestmentValuation } from "../../../types";

interface Props {
  open: boolean;
  /** A debt records a balance owed; the others a value, as a gain % or a figure. */
  domain: AccountDomain;
  /** The account / pocket — or pre-account category — being valued. */
  selector: ValueSelector;
  name: string;
  /** What's been paid in (or repaid) so far, in `currency`. */
  costBasis: number;
  /** Debts: what the balance is estimated to be today, to open the form on. */
  latestValue?: number;
  /** What `costBasis` and `latestValue` are in; the form opens on it, the owner can switch. */
  currency: Currency;
  /** Present = edit. */
  valuation?: InvestmentValuation;
  /** The domain's categories; only roots are offered. Omit to hide the field. */
  categories?: Category[];
  /** Prefilled when the check is new: where most of this position's money came in. */
  suggestedCategoryId?: string | null;
  onClose: () => void;
}

/**
 * Gain % and Value are two views of one number. Typing either recomputes the
 * other from the basis; whichever was edited last is what gets saved — so
 * "+100% → 260, but actually it's 230" is a two-keystroke correction. A debt
 * has no gain to type: the form is just the balance owed, saved with a 0 %.
 *
 * The check is written in whichever currency the statement is in: switching
 * it converts the basis (and what's typed) at today's rate, so the gain %
 * still compares like with like.
 */
export function ValuationModal({
  open,
  domain,
  selector,
  name,
  costBasis,
  latestValue,
  currency,
  valuation,
  categories,
  suggestedCategoryId,
  onClose,
}: Props) {
  const { formatAmount, decimals } = useMoneyFormat();
  const { sanitize, parse, toInput, toPrefill } = useDecimalInput();
  const { ctx, fxMissing } = useMoneyContext();
  const { optionsFor } = useEnabledCurrencies();
  const sourceCurrency = valuation?.currency ?? currency;
  const [checkCurrency, setCheckCurrency] = useState<Currency>(sourceCurrency);
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [gain, setGain] = useState("");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const owes = domain === "DEBT";

  useEffect(() => {
    if (!open) return;
    setError(null);
    setCheckCurrency(valuation?.currency ?? currency);
    if (valuation) {
      setDate(toDateInputValue(valuation.asOf.toDate()));
      setGain(toPrefill(roundTo(valuation.gainPct, 2)));
      setValue(toPrefill(roundTo(valuation.value, decimals)));
      setNote(valuation.note ?? "");
      setCategoryId(valuation.categoryId ?? "");
    } else {
      setDate(toDateInputValue(new Date()));
      setGain("");
      setValue(toPrefill(roundTo(owes ? (latestValue ?? 0) : costBasis, decimals)));
      setNote("");
      setCategoryId(suggestedCategoryId ?? "");
    }
  }, [
    open,
    valuation,
    costBasis,
    currency,
    suggestedCategoryId,
    owes,
    latestValue,
    toPrefill,
    decimals,
  ]);

  const sourceBasis = valuation ? valuation.costBasis : costBasis;
  const basis =
    checkCurrency === sourceCurrency
      ? sourceBasis
      : convert(sourceBasis, sourceCurrency, checkCurrency, ctx.rates);
  // A gain % needs something to be a percentage of: with withdrawals the net
  // basis can be zero or below, and then the value is all there is to say.
  const valueOnly = owes || basis <= 0;

  // Same worth, other units: the typed value follows, and the gain % — a
  // ratio of two converted figures — doesn't move.
  const onCurrencyChange = (next: Currency) => {
    const v = parse(value);
    if (v !== null) {
      setValue(toInput(roundTo(convert(v, checkCurrency, next, ctx.rates), decimals)));
    }
    setCheckCurrency(next);
  };

  const onGainChange = (raw: string) => {
    const cleaned = sanitize(raw, { negative: true });
    setGain(cleaned);
    const pct = parse(cleaned);
    if (pct !== null) setValue(toInput(roundTo(valueFromGain(basis, pct), decimals)));
  };

  const onValueChange = (raw: string) => {
    const cleaned = sanitize(raw);
    setValue(cleaned);
    if (valueOnly) return;
    const v = parse(cleaned);
    const pct = v === null ? null : gainFromValue(basis, v);
    if (pct !== null) setGain(toInput(roundTo(pct, 2)));
  };

  const submit = async () => {
    const v = parse(value) ?? NaN;
    // An empty gain follows the value: the placeholder 0 only means "no gain"
    // when the value says so too.
    const pct = valueOnly ? 0 : (parse(gain) ?? gainFromValue(basis, v) ?? 0);
    if (!(v >= 0) || !Number.isFinite(pct)) {
      return setError(owes ? "Enter the balance owed" : "Enter a value or a gain %");
    }
    if (!date) return setError("Pick a date");

    setBusy(true);
    setError(null);
    try {
      const [y, m, d] = date.split("-").map(Number);
      const asOf = new Date(y, m - 1, d, 12).toISOString();
      if (valuation?.id) {
        await updateInvestmentValuation(valuation.id, {
          asOf,
          gainPct: pct,
          value: v,
          ...(checkCurrency !== valuation.currency
            ? { currency: checkCurrency, costBasis: basis }
            : {}),
          note: note.trim() || null,
          ...(categories ? { categoryId: categoryId || null } : {}),
        });
      } else {
        await createInvestmentValuation({
          ...selector,
          asOf,
          gainPct: pct,
          value: v,
          costBasis: basis,
          currency: checkCurrency,
          ...(categoryId ? { categoryId } : {}),
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
      title={
        owes
          ? valuation
            ? `Edit balance — ${name}`
            : `Balance — ${name}`
          : valuation
            ? `Edit valuation — ${name}`
            : `Value ${name}`
      }
      onClose={onClose}
    >
      <div className="form">
        <p className="basis">
          {owes ? "Repaid" : "Invested"} so far:{" "}
          <strong>{formatAmount(basis, checkCurrency)}</strong>
        </p>

        <div className="pair">
          <TextField label="As of" type="date" value={date} onValueChange={setDate} />
          <Select
            label="Currency"
            options={optionsFor(checkCurrency)}
            value={checkCurrency}
            /* Without rates a switch would convert 1:1 — a made-up basis. */
            disabled={fxMissing}
            onValueChange={(v) => onCurrencyChange(v as Currency)}
          />
        </div>

        {valueOnly ? (
          <>
            <TextField
              label={owes ? "Balance owed" : "Current value"}
              inputMode="decimal"
              prefix={CURRENCY_SYMBOL[checkCurrency]}
              align="right"
              placeholder="0"
              value={value}
              onValueChange={onValueChange}
            />
            {!owes && (
              <p className="hint">
                {basis === 0
                  ? `Nothing has been paid into this ${ACCOUNT_NOUN[domain].singular} yet, so there is no gain % to work out — just what it's worth.`
                  : "Nothing is net invested after withdrawals, so there is no gain % to type — just what the position is worth."}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="pair">
              <TextField
                label="Gain %"
                inputMode="decimal"
                align="right"
                placeholder="0"
                value={gain}
                onValueChange={onGainChange}
              />
              <TextField
                label="Current value"
                inputMode="decimal"
                prefix={CURRENCY_SYMBOL[checkCurrency]}
                align="right"
                placeholder="0"
                value={value}
                onValueChange={onValueChange}
              />
            </div>
            <p className="hint">
              Type either one — the other follows. Override the value if your broker says otherwise.
            </p>
          </>
        )}

        {categories && (
          <>
            <Select
              label="Category"
              /* An explicit empty option rather than the placeholder, which is
                 disabled: a gain filed by mistake has to be unfilable. */
              options={[
                { value: "", label: "No category" },
                ...categories
                  .filter((c) => !c.parentId && c.id)
                  .map((c) => ({ value: c.id!, label: c.name })),
              ]}
              value={categoryId}
              onValueChange={setCategoryId}
            />
            <p className="hint">
              {owes
                ? "Where the interest & charges this balance reveals belong in the month's breakdown. A debt can hold several categories and only you know which one moved."
                : "Where this gain belongs in the month's breakdown. An account can hold several holdings and only you know which one moved."}
            </p>
          </>
        )}

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
          /* The form scrolls under this row, so it is glass rather than a
             plate: what passes behind it stays visible, just out of focus. */
          background-color: var(--glass-strong);
          backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate));
          -webkit-backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate));
          box-shadow: inset 0 1px 0 var(--glass-edge);
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
