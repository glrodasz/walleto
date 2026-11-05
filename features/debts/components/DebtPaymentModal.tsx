import { useState } from "react";
import { Modal } from "../../../components/molecules/Modal";
import { TextField } from "../../../components/atoms/TextField";
import { Select } from "../../../components/atoms/Select";
import { Button } from "../../../components/atoms/Button";
import { CURRENCY_SYMBOL } from "../../../constants";
import { convert } from "../../../helpers/fx";
import type { MoneyContext } from "../../../helpers/aggregations";
import { createTransaction } from "../../../hooks/useTransactions";
import { useDecimalInput } from "../../../hooks/useDecimalInput";
import { useEnabledCurrencies } from "../../../hooks/useEnabledCurrencies";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useT } from "../../../hooks/useT";
import { roundTo } from "../../../utils/decimal";
import { errorMessage } from "../../../utils/errorMessage";
import { COMMON_MESSAGES } from "../../../messages/common";
import { DEBT_MESSAGES } from "../messages";
import type { DebtSummaryRow } from "../helpers/debtSummary";
import type { Category, Currency } from "../../../types";

export type DebtPaymentMode = "part" | "all" | "borrow";

interface Props {
  mode: DebtPaymentMode;
  debt: DebtSummaryRow;
  /** The DEBT categories; roots only are offered. */
  categories: Category[];
  ctx: MoneyContext;
  onClose: () => void;
}

/**
 * The quick actions of "What you owe": a payment (part or all of the
 * balance) or more borrowed, written as a one-off on the debt dated today.
 * A payment counts in the month; borrowing only moves the balance.
 */
export function DebtPaymentModal({ mode, debt, categories, ctx, onClose }: Props) {
  const t = useT(DEBT_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  const decimal = useDecimalInput();
  const { formatAmount } = useMoneyFormat();
  const { optionsFor } = useEnabledCurrencies();
  const { row } = debt;
  const own: Currency = row.currency ?? ctx.target;
  const inOwn = (amount: number) => roundTo(convert(amount, ctx.target, own, ctx.rates), 2);
  const prefill =
    mode === "all"
      ? inOwn(row.value)
      : mode === "part" && debt.monthly > 0
        ? inOwn(debt.monthly)
        : 0;
  const roots = categories.filter((c) => !c.parentId && !c.archived);

  const [raw, setRaw] = useState(decimal.toPrefill(prefill));
  const [currency, setCurrency] = useState<Currency>(own);
  const [categoryId, setCategoryId] = useState(debt.categoryId ?? roots[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const amount = decimal.parse(raw);
    if (amount === null || !(amount > 0)) {
      setError(t("pay.error.amount"));
      return;
    }
    if (!categoryId) {
      setError(t("pay.error.category"));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createTransaction({
        domain: "DEBT",
        categoryId,
        ...("accountId" in row.selector ? { accountId: row.selector.accountId } : {}),
        name: t(mode === "borrow" ? "pay.name.borrow" : "pay.name.part", { name: row.name }),
        amount,
        currency,
        occurredAt: new Date().toISOString(),
        status: "PAID",
        ...(mode === "borrow" ? { direction: "OUT" as const } : {}),
      });
      onClose();
    } catch (err) {
      setError(errorMessage(err, t("pay.error.save")));
      setSaving(false);
    }
  };

  const title = t(`pay.title.${mode}`, { name: row.name });
  const save = t(
    mode === "all" ? "pay.save.all" : mode === "borrow" ? "pay.save.borrow" : "pay.save.part"
  );

  return (
    <Modal open title={title} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {row.known && row.value > 0 && (
          <p className="owed">{t("pay.owed", { amount: formatAmount(row.value, ctx.target) })}</p>
        )}
        <div className="pair">
          <TextField
            label={t("pay.amount")}
            hint={t(mode === "borrow" ? "pay.hint.borrow" : "pay.hint")}
            placeholder="0"
            inputMode="decimal"
            prefix={CURRENCY_SYMBOL[currency]}
            align="right"
            autoFocus
            value={raw}
            onValueChange={(v) => setRaw(decimal.sanitize(v))}
          />
          <Select
            label={tc("noun.currency")}
            options={optionsFor(currency)}
            value={currency}
            onValueChange={(v) => setCurrency(v as Currency)}
          />
        </div>
        {roots.length > 1 && (
          <Select
            label={t("pay.category")}
            options={roots.map((c) => ({ value: c.id!, label: c.name }))}
            value={categoryId}
            onValueChange={setCategoryId}
          />
        )}
        {error && <p className="form-error">{error}</p>}
        <div className="actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tc("action.cancel")}
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {save}
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
          grid-template-columns: minmax(0, 1fr) minmax(110px, auto);
          gap: 10px;
        }

        .owed {
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
