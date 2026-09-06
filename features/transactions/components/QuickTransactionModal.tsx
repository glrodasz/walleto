import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/molecules/Modal";
import { CategoryField } from "../../../components/molecules/CategoryField";
import { Select } from "../../../components/atoms/Select";
import { TextField } from "../../../components/atoms/TextField";
import { Button } from "../../../components/atoms/Button";
import { useCategories } from "../../../hooks/useCategories";
import { usePaymentMethods } from "../../../hooks/usePaymentMethods";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { createTransaction } from "../../../hooks/useTransactions";
import { paymentMethodOptionLabel } from "../../../helpers/paymentMethodLabel";
import { anchorStartDate, toDateInputValue } from "../../../helpers/scheduleAnchor";
import { DOMAIN_CONFIG } from "../../domains/helpers/domainConfig";
import { SELECTABLE_CURRENCIES, CURRENCY_SYMBOL } from "../../../constants";
import type { Currency, Domain } from "../../../types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Fixed by the page (a domain page); absent = the user picks. */
  domain?: Domain;
}

/** Exported so the create launcher can name the option the same way. */
export const QUICK_COPY: Record<Domain, { title: string; placeholder: string }> = {
  EXPENSE: { title: "Record a payment", placeholder: "Groceries" },
  INCOME: { title: "Record an income", placeholder: "Freelance invoice" },
  INVESTMENT: { title: "Record a contribution", placeholder: "Index fund buy" },
  SAVING: { title: "Record a deposit", placeholder: "Emergency fund" },
};

const DOMAINS: Domain[] = ["EXPENSE", "INCOME", "INVESTMENT", "SAVING"];
const DOMAIN_LABEL: Record<Domain, string> = {
  EXPENSE: "Expense",
  INCOME: "Income",
  INVESTMENT: "Investment",
  SAVING: "Saving",
};

const CURRENCY_OPTIONS = SELECTABLE_CURRENCIES.map((c) => ({
  value: c.value,
  label: `${CURRENCY_SYMBOL[c.value]} ${c.label}`,
}));

interface FormState {
  categoryId: string;
  name: string;
  amount: string;
  currency: Currency | "";
  date: string;
  paymentMethodId: string;
}

/**
 * One dated transaction, recorded as PAID: the day-to-day entry that recurring
 * items never cover (a coffee, a one-off invoice). It shows up immediately in
 * the period total, the chart and Recent payments through the live queries.
 */
export function QuickTransactionModal({ open, onClose, domain: fixedDomain }: Props) {
  const [domain, setDomain] = useState<Domain>(fixedDomain ?? "EXPENSE");
  const config = DOMAIN_CONFIG[domain];
  const { userDoc } = useUserDoc();
  const { categories, create: createCategory } = useCategories(domain);
  const { methods } = usePaymentMethods();

  const empty: FormState = useMemo(
    () => ({
      categoryId: "",
      name: "",
      amount: "",
      currency: "",
      date: toDateInputValue(new Date()),
      paymentMethodId: "",
    }),
    []
  );
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDomain(fixedDomain ?? "EXPENSE");
    setForm(empty);
    setFormError(null);
  }, [open, fixedDomain, empty]);

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const effectiveCurrency: Currency =
    form.currency ||
    methods.find((m) => m.id === form.paymentMethodId)?.defaultCurrency ||
    userDoc?.mainCurrency ||
    "USD";

  const onSelectMethod = (paymentMethodId: string) => {
    const method = methods.find((m) => m.id === paymentMethodId);
    patch({
      paymentMethodId,
      ...(form.currency === "" && method?.defaultCurrency
        ? { currency: method.defaultCurrency }
        : {}),
    });
  };

  const switchDomain = (next: Domain) => {
    setDomain(next);
    patch({ categoryId: "" });
  };

  const methodOptions = methods.map((m) => ({ value: m.id!, label: paymentMethodOptionLabel(m) }));

  const submit = async () => {
    const amount = Number(form.amount);
    if (!form.categoryId) return setFormError("Pick a category");
    if (!form.name.trim()) return setFormError("Give it a name");
    if (!(amount > 0)) return setFormError("Amount must be greater than zero");
    if (!form.date) return setFormError("Pick a date");

    setBusy(true);
    setFormError(null);
    try {
      await createTransaction({
        domain,
        categoryId: form.categoryId,
        name: form.name.trim(),
        amount,
        currency: effectiveCurrency,
        occurredAt: anchorStartDate({ frequency: "ONE_TIME", date: form.date }).toISOString(),
        status: "PAID",
        ...(form.paymentMethodId ? { paymentMethodId: form.paymentMethodId } : {}),
      });
      onClose();
    } catch (err) {
      console.error("Failed to record transaction:", err);
      setFormError("Couldn't save — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={QUICK_COPY[domain].title} onClose={onClose}>
      <div className="form">
        {!fixedDomain && (
          <div className="domains" role="group" aria-label="Type">
            {DOMAINS.map((d) => (
              <button
                key={d}
                type="button"
                className={`domain${d === domain ? " is-active" : ""}`}
                aria-pressed={d === domain}
                style={{ "--tab-accent": DOMAIN_CONFIG[d].accent } as React.CSSProperties}
                onClick={() => switchDomain(d)}
              >
                {DOMAIN_LABEL[d]}
              </button>
            ))}
          </div>
        )}

        <CategoryField
          categories={categories}
          value={form.categoryId}
          onChange={(categoryId) => patch({ categoryId })}
          createCategory={(name) => createCategory({ domain, name })}
          newLabel={`New ${config.title.toLowerCase()} category`}
          onError={setFormError}
        />

        <TextField
          label="Name"
          placeholder={QUICK_COPY[domain].placeholder}
          value={form.name}
          onValueChange={(v) => patch({ name: v })}
        />

        <div className="pair">
          <TextField
            label="Amount"
            placeholder="0"
            inputMode="decimal"
            prefix={CURRENCY_SYMBOL[effectiveCurrency]}
            align="right"
            value={form.amount}
            onValueChange={(v) => patch({ amount: v })}
          />
          <Select
            label="Currency"
            options={CURRENCY_OPTIONS}
            value={effectiveCurrency}
            onValueChange={(v) => patch({ currency: v as Currency })}
          />
        </div>

        <div className="pair">
          <TextField
            label="Date"
            type="date"
            value={form.date}
            max={toDateInputValue(new Date())}
            onValueChange={(v) => patch({ date: v })}
          />
          {methods.length > 0 && (
            <Select
              label="Payment method"
              placeholder="None"
              options={methodOptions}
              value={form.paymentMethodId}
              onValueChange={onSelectMethod}
            />
          )}
        </div>

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <div className="actions">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .domains {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }

        .domain {
          min-height: 40px;
          padding: 8px 4px;
          border: 1px solid var(--line);
          border-radius: var(--r-sm);
          background: var(--bg-2);
          color: var(--fg-1);
          font-family: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }

        .domain.is-active {
          border-color: var(--tab-accent);
          color: var(--tab-accent);
          background: color-mix(in srgb, var(--tab-accent) 12%, transparent);
        }

        .pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
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
