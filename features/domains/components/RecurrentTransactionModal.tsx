import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/molecules/Modal";
import { ScheduleFields } from "../../../components/molecules/ScheduleFields";
import type { ScheduleValue } from "../../../components/molecules/ScheduleFields";
import { CategoryField } from "../../../components/molecules/CategoryField";
import { Select } from "../../../components/atoms/Select";
import { TextField } from "../../../components/atoms/TextField";
import { Button } from "../../../components/atoms/Button";
import { useCategories } from "../../../hooks/useCategories";
import { usePaymentMethods } from "../../../hooks/usePaymentMethods";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { materializeNow } from "../../../hooks/useMaterialize";
import { createInvestmentValuation } from "../../../hooks/useInvestmentValuations";
import { valueFromGain } from "../../investments/helpers/valuation";
import { paymentMethodOptionLabel } from "../../../helpers/paymentMethodLabel";
import {
  BACKFILL_MONTHS,
  anchorStartDate,
  scheduleChoiceFromStartDate,
  toDateInputValue,
} from "../../../helpers/scheduleAnchor";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
import { SELECTABLE_CURRENCIES, CURRENCY_SYMBOL, FREQUENCY_LABELS } from "../../../constants";
import type { Currency, Domain, Frequency, RecurrentTransaction } from "../../../types";

const FREQUENCY_OPTIONS = (Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => ({
  value: f,
  label: FREQUENCY_LABELS[f],
}));

const CURRENCY_OPTIONS = SELECTABLE_CURRENCIES.map((c) => ({
  value: c.value,
  label: `${CURRENCY_SYMBOL[c.value]} ${c.label}`,
}));

interface Props {
  domain: Domain;
  open: boolean;
  /** Present = edit; absent = create. */
  item?: RecurrentTransaction;
  onClose: () => void;
}

interface FormState extends ScheduleValue {
  categoryId: string;
  name: string;
  amount: string;
  currency: Currency | "";
  frequency: Frequency;
  paymentMethodId: string;
  /** Create only: anchor the schedule BACKFILL_MONTHS back so history gets written. */
  backfill: boolean;
  /** Create only, INVESTMENT + ONE_TIME: record how the purchase has done so far. */
  gainPct: string;
  chargedEnabled: boolean;
  chargedAmount: string;
  chargedCurrency: Currency | "";
}

export function RecurrentTransactionModal({ domain, open, item, onClose }: Props) {
  const config = DOMAIN_CONFIG[domain];
  const noun = config.noun.replace(/s$/, "");
  const { userDoc } = useUserDoc();
  const { categories, create: createCategory } = useCategories(domain);
  const { methods } = usePaymentMethods();
  const { create, update } = useRecurrentTransactions(domain);

  const empty: FormState = useMemo(
    () => ({
      categoryId: "",
      name: "",
      amount: "",
      currency: "",
      frequency: "MONTHLY",
      paymentMethodId: "",
      dayOfMonth: 1,
      secondDayOfMonth: 15,
      month: 0,
      date: toDateInputValue(new Date()),
      backfill: true,
      gainPct: "",
      chargedEnabled: false,
      chargedAmount: "",
      chargedCurrency: "",
    }),
    []
  );

  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Re-seed whenever the modal opens for a different target.
  useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (!item) {
      setForm(empty);
      return;
    }
    const schedule = scheduleChoiceFromStartDate(
      item.startDate.toDate(),
      item.frequency,
      item.secondDayOfMonth
    );
    setForm({
      categoryId: item.categoryId,
      name: item.name,
      amount: String(item.amount),
      currency: item.currency,
      frequency: item.frequency,
      paymentMethodId: item.paymentMethodId ?? "",
      dayOfMonth: schedule.dayOfMonth ?? 1,
      secondDayOfMonth: schedule.secondDayOfMonth ?? 15,
      month: schedule.month ?? 0,
      date: schedule.date ?? empty.date,
      backfill: false,
      gainPct: "",
      chargedEnabled: item.chargedAmount !== undefined,
      chargedAmount: item.chargedAmount !== undefined ? String(item.chargedAmount) : "",
      chargedCurrency: item.chargedCurrency ?? "",
    });
  }, [open, item, empty]);

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  // Per-item currency default: the chosen method's defaultCurrency when it
  // has one, the user's main currency otherwise.
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

  const methodOptions = methods.map((m) => ({ value: m.id!, label: paymentMethodOptionLabel(m) }));

  const isRecurring = form.frequency !== "ONE_TIME";
  const offersGain = !item && domain === "INVESTMENT" && !isRecurring;
  const gainPct = offersGain && form.gainPct.trim() !== "" ? Number(form.gainPct) : null;

  const submit = async () => {
    const amount = Number(form.amount);
    if (!form.categoryId) return setFormError("Pick a category");
    if (!form.name.trim()) return setFormError("Give it a name");
    if (!(amount > 0)) return setFormError("Amount must be greater than zero");

    const chargedAmount = form.chargedEnabled ? Number(form.chargedAmount) : undefined;
    if (form.chargedEnabled) {
      if (!(chargedAmount! > 0) || !form.chargedCurrency)
        return setFormError("Fill both charged fields or turn the toggle off");
      if (form.chargedCurrency === effectiveCurrency)
        return setFormError("Charged currency must differ from the item's currency");
    }
    if (gainPct !== null && !Number.isFinite(gainPct)) {
      return setFormError("Gain % must be a number (0 means break-even)");
    }

    const startDate = anchorStartDate({
      frequency: form.frequency,
      dayOfMonth: form.dayOfMonth,
      secondDayOfMonth: form.secondDayOfMonth,
      month: form.month,
      date: form.date,
      backfill: !item && isRecurring && form.backfill,
    });

    setBusy(true);
    setFormError(null);
    try {
      if (item?.id) {
        const twiceMonthly = form.frequency === "BIWEEKLY" ? form.secondDayOfMonth : null;
        const scheduleChanged =
          form.frequency !== item.frequency ||
          startDate.getTime() !== item.startDate.toDate().getTime() ||
          twiceMonthly !== (item.secondDayOfMonth ?? null);
        await update(item.id, {
          categoryId: form.categoryId,
          name: form.name.trim(),
          amount,
          currency: effectiveCurrency,
          // Only a real schedule change should move nextOccurrence.
          ...(scheduleChanged
            ? {
                frequency: form.frequency,
                startDate: startDate.toISOString(),
                secondDayOfMonth: twiceMonthly,
              }
            : {}),
          paymentMethodId: form.paymentMethodId || null,
          chargedAmount: form.chargedEnabled ? chargedAmount! : null,
          chargedCurrency: form.chargedEnabled ? (form.chargedCurrency as Currency) : null,
        });
        if (scheduleChanged && startDate < new Date()) {
          await materializeNow().catch((err) => console.error("materialize failed:", err));
        }
      } else {
        await create({
          domain,
          categoryId: form.categoryId,
          name: form.name.trim(),
          amount,
          currency: effectiveCurrency,
          frequency: form.frequency,
          ...(form.frequency === "BIWEEKLY" ? { secondDayOfMonth: form.secondDayOfMonth } : {}),
          startDate: startDate.toISOString(),
          ...(form.paymentMethodId ? { paymentMethodId: form.paymentMethodId } : {}),
          ...(form.chargedEnabled
            ? { chargedAmount: chargedAmount!, chargedCurrency: form.chargedCurrency as Currency }
            : {}),
        });
        // Anything anchored in the past has occurrences to write.
        if (startDate < new Date()) {
          await materializeNow().catch((err) => console.error("materialize failed:", err));
        }
        // A past one-time investment can carry its performance so far. The
        // basis is this purchase alone; the Investments page recomputes the
        // category's live basis and the user can re-value there any time.
        if (gainPct !== null) {
          await createInvestmentValuation({
            categoryId: form.categoryId,
            asOf: new Date().toISOString(),
            gainPct,
            value: valueFromGain(amount, gainPct),
            costBasis: amount,
            currency: effectiveCurrency,
            note: `Recorded with ${form.name.trim()}`,
          }).catch((err) => console.error("valuation failed:", err));
        }
      }
      onClose();
    } catch (err) {
      console.error("Failed to save recurrent transaction:", err);
      setFormError("Couldn't save — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={item ? `Edit ${form.name || noun}` : `New ${noun}`} onClose={onClose}>
      <div className="form">
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
          placeholder="Name"
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
            onValueChange={(v) => patch({ amount: v.replace(/[^\d.]/g, "") })}
          />
          <Select
            label="Currency"
            options={CURRENCY_OPTIONS}
            value={effectiveCurrency}
            onValueChange={(v) => patch({ currency: v as Currency })}
          />
        </div>

        <div className="pair">
          <Select
            label="Frequency"
            options={FREQUENCY_OPTIONS}
            value={form.frequency}
            onValueChange={(v) => patch({ frequency: v as Frequency })}
          />
          <Select
            label="Payment method"
            placeholder="None"
            options={methodOptions}
            value={form.paymentMethodId}
            onValueChange={onSelectMethod}
          />
        </div>

        <div className="pair">
          <ScheduleFields frequency={form.frequency} value={form} onChange={(p) => patch(p)} />
        </div>

        {!item && isRecurring && (
          <label className="toggle">
            <input
              type="checkbox"
              checked={form.backfill}
              onChange={(e) => patch({ backfill: e.currentTarget.checked })}
            />
            <span>
              Backfill the last {BACKFILL_MONTHS} months
              <span className="hint"> — I&rsquo;ve been paying this for a while</span>
            </span>
          </label>
        )}

        {offersGain && (
          <div className="pair">
            <TextField
              label="Gain so far % (optional)"
              placeholder="0"
              inputMode="decimal"
              align="right"
              value={form.gainPct}
              onValueChange={(v) => patch({ gainPct: v.replace(/[^\d.-]/g, "") })}
            />
            <p className="field-hint">
              0 = break-even, 100 = doubled. Records a first valuation for this category; you can
              refine it on the Investments page.
            </p>
          </div>
        )}

        <label className="toggle">
          <input
            type="checkbox"
            checked={form.chargedEnabled}
            onChange={(e) => patch({ chargedEnabled: e.currentTarget.checked })}
          />
          <span>
            My card was charged a different amount
            <span className="hint">
              {" "}
              — e.g. a $15.49 subscription billed as 62,700 COP. Records the real cost and the
              exchange rate you actually paid.
            </span>
          </span>
        </label>

        {form.chargedEnabled && (
          <div className="pair">
            <TextField
              label="Charged amount"
              placeholder="0"
              inputMode="decimal"
              align="right"
              value={form.chargedAmount}
              onValueChange={(v) => patch({ chargedAmount: v.replace(/[^\d.]/g, "") })}
            />
            <Select
              label="Charged currency"
              placeholder="Currency"
              options={CURRENCY_OPTIONS.filter((c) => c.value !== effectiveCurrency)}
              value={form.chargedCurrency}
              onValueChange={(v) => patch({ chargedCurrency: v as Currency })}
            />
          </div>
        )}

        {formError && <p className="form-error">{formError}</p>}

        <div className="actions">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : item ? "Save changes" : "Create"}
          </Button>
        </div>
      </div>

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

        .toggle {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--fg-1);
          cursor: pointer;
        }

        .toggle input {
          margin-top: 3px;
          flex-shrink: 0;
          accent-color: var(--accent);
        }

        .hint {
          color: var(--fg-2);
        }

        .field-hint {
          margin: 24px 0 0;
          font-size: 0.78rem;
          color: var(--fg-2);
          align-self: center;
        }

        .form-error {
          margin: 0;
          font-size: 0.85rem;
          color: var(--accent-hot);
        }

        /* Sticks to the bottom of the scrolling sheet so Cancel/Create stay
           reachable on a long form. Negative margins span the body padding. */
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

          .field-hint {
            margin-top: 0;
            align-self: flex-start;
          }
        }
      `}</style>
    </Modal>
  );
}
