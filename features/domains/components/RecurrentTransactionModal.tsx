import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/molecules/Modal";
import { ScheduleFields } from "../../../components/molecules/ScheduleFields";
import type { ScheduleValue } from "../../../components/molecules/ScheduleFields";
import { CategoryField } from "../../../components/molecules/CategoryField";
import { PaymentMethodField } from "../../../components/molecules/PaymentMethodField";
import { AccountField } from "../../../components/molecules/AccountField";
import { TagsField } from "../../../components/molecules/TagsField";
import { TextArea } from "../../../components/atoms/TextArea";
import { Select } from "../../../components/atoms/Select";
import { TextField } from "../../../components/atoms/TextField";
import { Button } from "../../../components/atoms/Button";
import { useCategories } from "../../../hooks/useCategories";
import { usePaymentMethods } from "../../../hooks/usePaymentMethods";
import { useAccounts } from "../../../hooks/useAccounts";
import { useTags } from "../../../hooks/useTags";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { materializeNow } from "../../../hooks/useMaterialize";
import { createTransaction, updateTransaction } from "../../../hooks/useTransactions";
import { createInvestmentValuation } from "../../../hooks/useInvestmentValuations";
import { valueFromGain } from "../../investments/helpers/valuation";
import { FREQ_TO_MONTHS } from "../../../helpers/aggregations";
import { formatAmount } from "../../../components/atoms/Amount";
import { isAccountDomain } from "../../../helpers/accounts";
import {
  BACKFILL_MONTHS,
  anchorStartDate,
  scheduleChoiceFromStartDate,
  toDateInputValue,
} from "../../../helpers/scheduleAnchor";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
import { SELECTABLE_CURRENCIES, CURRENCY_SYMBOL, FREQUENCY_LABELS } from "../../../constants";
import type {
  Currency,
  Domain,
  Frequency,
  RecurrentTransaction,
  Transaction,
} from "../../../types";

const FREQUENCY_OPTIONS = (Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => ({
  value: f,
  label: FREQUENCY_LABELS[f],
}));

const NEXT_DATE = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

const CURRENCY_OPTIONS = SELECTABLE_CURRENCIES.map((c) => ({
  value: c.value,
  label: `${CURRENCY_SYMBOL[c.value]} ${c.label}`,
}));

interface Props {
  domain: Domain;
  open: boolean;
  /** Present = edit this recurring item. */
  item?: RecurrentTransaction;
  /** Present = edit this one-off transaction (the frequency stays "One time"). */
  transaction?: Transaction;
  /** Create only: what the frequency starts as ("Record a payment" opens on One time). */
  initialFrequency?: Frequency;
  /** Transaction mode: jump to the recurring item that wrote this row. */
  onOpenItem?: (item: RecurrentTransaction) => void;
  onClose: () => void;
}

interface FormState extends ScheduleValue {
  categoryId: string;
  /** INVESTMENT / SAVING only. */
  accountId: string;
  name: string;
  amount: string;
  currency: Currency | "";
  frequency: Frequency;
  paymentMethodId: string;
  /** Tag ids. */
  tags: string[];
  note: string;
  /** Recurring only: copy tags / note onto each payment the item writes. */
  inheritTags: boolean;
  inheritNote: boolean;
  /** Item edit only: also rewrite the payments already written. */
  applyToExisting: boolean;
  /** Non-monthly cadences: chart amount ÷ N each month instead of the real spike. */
  spreadMonthly: boolean;
  /** Create only: anchor the schedule BACKFILL_MONTHS back so history gets written. */
  backfill: boolean;
  /** Create only, INVESTMENT + ONE_TIME: record how the purchase has done so far. */
  gainPct: string;
  chargedEnabled: boolean;
  chargedAmount: string;
  chargedCurrency: Currency | "";
}

export function RecurrentTransactionModal({
  domain,
  open,
  item,
  transaction,
  initialFrequency = "MONTHLY",
  onOpenItem,
  onClose,
}: Props) {
  const config = DOMAIN_CONFIG[domain];
  const noun = config.noun.replace(/s$/, "");
  const { userDoc } = useUserDoc();
  const { categories, create: createCategory } = useCategories(domain);
  const { methods, create: createMethod } = usePaymentMethods();
  const hasAccounts = isAccountDomain(domain);
  const { accounts, create: createAccount } = useAccounts(hasAccounts ? domain : null);
  const { tags: allTags, create: createTag } = useTags();
  const { items, create, update } = useRecurrentTransactions(domain);
  // The row's recurring item — only active ones are listed, so a stopped
  // item leaves the row with nothing to link to.
  const parent = transaction?.recurrentTransactionId
    ? items.find((i) => i.id === transaction.recurrentTransactionId)
    : undefined;

  const empty: FormState = useMemo(
    () => ({
      categoryId: "",
      accountId: "",
      name: "",
      amount: "",
      currency: "",
      frequency: initialFrequency,
      paymentMethodId: "",
      tags: [],
      note: "",
      inheritTags: false,
      inheritNote: false,
      applyToExisting: false,
      spreadMonthly: false,
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
    [initialFrequency]
  );

  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Re-seed whenever the modal opens for a different target.
  useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (transaction) {
      setForm({
        ...empty,
        categoryId: transaction.categoryId,
        accountId: transaction.accountId ?? "",
        name: transaction.name,
        amount: String(transaction.amount),
        currency: transaction.currency,
        frequency: "ONE_TIME",
        paymentMethodId: transaction.paymentMethodId ?? "",
        tags: transaction.tags ?? [],
        note: transaction.note ?? "",
        date: toDateInputValue(transaction.occurredAt.toDate()),
        backfill: false,
        chargedEnabled: transaction.chargedAmount !== undefined,
        chargedAmount:
          transaction.chargedAmount !== undefined ? String(transaction.chargedAmount) : "",
        chargedCurrency: transaction.chargedCurrency ?? "",
      });
      return;
    }
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
      accountId: item.accountId ?? "",
      name: item.name,
      amount: String(item.amount),
      currency: item.currency,
      frequency: item.frequency,
      paymentMethodId: item.paymentMethodId ?? "",
      tags: item.tags ?? [],
      note: item.note ?? "",
      inheritTags: Boolean(item.inheritTags),
      inheritNote: Boolean(item.inheritNote),
      applyToExisting: false,
      spreadMonthly: Boolean(item.spreadMonthly),
      dayOfMonth: schedule.dayOfMonth ?? 1,
      secondDayOfMonth: schedule.secondDayOfMonth ?? 15,
      month: schedule.month ?? 0,
      date: schedule.date ?? empty.date,
      backfill: false,
      gainPct: "",
      chargedEnabled: false,
      chargedAmount: "",
      chargedCurrency: "",
    });
  }, [open, item, transaction, empty]);

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  // Per-item currency default: the account's currency, then the chosen
  // method's defaultCurrency, then the user's main currency.
  const effectiveCurrency: Currency =
    form.currency ||
    accounts.find((a) => a.id === form.accountId)?.currency ||
    methods.find((m) => m.id === form.paymentMethodId)?.defaultCurrency ||
    userDoc?.mainCurrency ||
    "USD";

  const onSelectAccount = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    patch({
      accountId,
      ...(form.currency === "" && account ? { currency: account.currency } : {}),
    });
  };

  const onSelectMethod = (paymentMethodId: string) => {
    const method = methods.find((m) => m.id === paymentMethodId);
    patch({
      paymentMethodId,
      ...(form.currency === "" && method?.defaultCurrency
        ? { currency: method.defaultCurrency }
        : {}),
    });
  };

  const isRecurring = form.frequency !== "ONE_TIME";
  const editing = Boolean(item || transaction);
  // Editing an item's tags / note (or switching inheritance on) can also
  // rewrite the payments it already wrote — offered, never silent.
  const sameIds = (a: string[], b: string[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);
  const tagsChanged = Boolean(item) && !sameIds(form.tags, item?.tags ?? []);
  const noteChanged = Boolean(item) && form.note.trim() !== (item?.note ?? "");
  const offersBackfill =
    Boolean(item) &&
    isRecurring &&
    ((form.inheritTags && (tagsChanged || !item?.inheritTags)) ||
      (form.inheritNote && (noteChanged || !item?.inheritNote)));
  // A charged pair is what the card actually did on one payment, so it lives
  // on ledger rows only: one-off create and transaction edit.
  const offersCharged = !isRecurring && !item;
  const offersGain = !editing && domain === "INVESTMENT" && !isRecurring;
  // Yearly, quarterly, weekly…: the plan can show it as a monthly amount.
  const offersSpread = isRecurring && form.frequency !== "MONTHLY";
  const monthlySlice = (Number(form.amount) || 0) * FREQ_TO_MONTHS[form.frequency];
  const gainPct = offersGain && form.gainPct.trim() !== "" ? Number(form.gainPct) : null;

  const submit = async () => {
    const amount = Number(form.amount);
    if (!form.categoryId) return setFormError("Pick a category");
    if (!form.name.trim()) return setFormError("Give it a name");
    if (!(amount > 0)) return setFormError("Amount must be greater than zero");

    const chargedAmount =
      offersCharged && form.chargedEnabled ? Number(form.chargedAmount) : undefined;
    if (offersCharged && form.chargedEnabled) {
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
      if (transaction?.id) {
        // A one-off row: send only what changed, the API keeps the rest.
        const name = form.name.trim();
        const dateChanged = toDateInputValue(transaction.occurredAt.toDate()) !== form.date;
        const methodBefore = transaction.paymentMethodId ?? "";
        const accountBefore = transaction.accountId ?? "";
        const sameTags =
          form.tags.length === (transaction.tags ?? []).length &&
          form.tags.every((t, i) => t === (transaction.tags ?? [])[i]);
        const noteBefore = transaction.note ?? "";
        const chargedBefore = transaction.chargedAmount !== undefined;
        const chargedChanged =
          form.chargedEnabled !== chargedBefore ||
          (form.chargedEnabled &&
            (chargedAmount !== transaction.chargedAmount ||
              form.chargedCurrency !== transaction.chargedCurrency));
        const patch = {
          ...(form.categoryId !== transaction.categoryId ? { categoryId: form.categoryId } : {}),
          ...(hasAccounts && form.accountId !== accountBefore
            ? { accountId: form.accountId || null }
            : {}),
          ...(name !== transaction.name ? { name } : {}),
          ...(amount !== transaction.amount ? { amount } : {}),
          ...(effectiveCurrency !== transaction.currency ? { currency: effectiveCurrency } : {}),
          ...(dateChanged ? { occurredAt: startDate.toISOString() } : {}),
          ...(form.paymentMethodId !== methodBefore
            ? { paymentMethodId: form.paymentMethodId || null }
            : {}),
          ...(sameTags ? {} : { tags: form.tags.length ? form.tags : null }),
          ...(form.note.trim() !== noteBefore ? { note: form.note.trim() || null } : {}),
          ...(chargedChanged
            ? {
                chargedAmount: form.chargedEnabled ? chargedAmount! : null,
                chargedCurrency: form.chargedEnabled ? (form.chargedCurrency as Currency) : null,
              }
            : {}),
        };
        if (Object.keys(patch).length > 0) await updateTransaction(transaction.id, patch);
      } else if (item?.id) {
        const twiceMonthly = form.frequency === "BIWEEKLY" ? form.secondDayOfMonth : null;
        const scheduleChanged =
          form.frequency !== item.frequency ||
          startDate.getTime() !== item.startDate.toDate().getTime() ||
          twiceMonthly !== (item.secondDayOfMonth ?? null);
        await update(item.id, {
          categoryId: form.categoryId,
          ...(hasAccounts ? { accountId: form.accountId || null } : {}),
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
          tags: form.tags.length ? form.tags : null,
          note: form.note.trim() || null,
          inheritTags: form.inheritTags,
          inheritNote: form.inheritNote,
          spreadMonthly: offersSpread && form.spreadMonthly,
          ...(offersBackfill && form.applyToExisting ? { applyToExisting: true } : {}),
          // An old item may still carry a pair; only clear it when the new
          // currency collides with it, which the API would otherwise refuse.
          ...(item.chargedCurrency && item.chargedCurrency === effectiveCurrency
            ? { chargedAmount: null, chargedCurrency: null }
            : {}),
        });
        if (scheduleChanged && startDate < new Date()) {
          await materializeNow().catch((err) => console.error("materialize failed:", err));
        }
      } else if (!isRecurring) {
        // "One time" is not a plan, it is a line in the ledger: a dated
        // transaction, no recurrent item behind it and nothing to materialize.
        await createTransaction({
          domain,
          categoryId: form.categoryId,
          ...(form.accountId ? { accountId: form.accountId } : {}),
          name: form.name.trim(),
          amount,
          currency: effectiveCurrency,
          occurredAt: startDate.toISOString(),
          status: "PAID",
          ...(form.paymentMethodId ? { paymentMethodId: form.paymentMethodId } : {}),
          ...(form.tags.length ? { tags: form.tags } : {}),
          ...(form.note.trim() ? { note: form.note.trim() } : {}),
          ...(form.chargedEnabled
            ? { chargedAmount: chargedAmount!, chargedCurrency: form.chargedCurrency as Currency }
            : {}),
        });
      } else {
        await create({
          domain,
          categoryId: form.categoryId,
          ...(form.accountId ? { accountId: form.accountId } : {}),
          name: form.name.trim(),
          amount,
          currency: effectiveCurrency,
          frequency: form.frequency,
          ...(form.frequency === "BIWEEKLY" ? { secondDayOfMonth: form.secondDayOfMonth } : {}),
          startDate: startDate.toISOString(),
          ...(form.paymentMethodId ? { paymentMethodId: form.paymentMethodId } : {}),
          ...(form.tags.length ? { tags: form.tags } : {}),
          ...(form.note.trim() ? { note: form.note.trim() } : {}),
          ...(form.inheritTags ? { inheritTags: true } : {}),
          ...(form.inheritNote ? { inheritNote: true } : {}),
          ...(offersSpread && form.spreadMonthly ? { spreadMonthly: true } : {}),
        });
        // Anything anchored in the past has occurrences to write.
        if (startDate < new Date()) {
          await materializeNow().catch((err) => console.error("materialize failed:", err));
        }
      }
      if (!editing) {
        // A past one-time investment can carry its performance so far. The
        // basis is this purchase alone; the Investments page recomputes the
        // category's live basis and the user can re-value there any time.
        if (gainPct !== null) {
          await createInvestmentValuation({
            ...(form.accountId ? { accountId: form.accountId } : { domain: "INVESTMENT" }),
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
    <Modal
      open={open}
      title={
        editing ? `Edit ${form.name || noun}` : isRecurring ? `New ${noun}` : config.oneOff.title
      }
      onClose={onClose}
    >
      <div className="form">
        <CategoryField
          categories={categories}
          value={form.categoryId}
          onChange={(categoryId) => patch({ categoryId })}
          createCategory={(name) => createCategory({ domain, name })}
          newLabel={`New ${config.title.toLowerCase()} category`}
          onError={setFormError}
        />

        {hasAccounts && (
          <AccountField
            domain={domain}
            accounts={accounts}
            value={form.accountId}
            onChange={onSelectAccount}
            createAccount={createAccount}
            defaultCurrency={effectiveCurrency}
            onError={setFormError}
          />
        )}

        {parent && (
          <div className="parent">
            <span className="parent-text">
              Part of the recurring item <strong>{parent.name}</strong> ·{" "}
              {FREQUENCY_LABELS[parent.frequency]}
              {parent.nextOccurrence
                ? ` · next ${NEXT_DATE.format(parent.nextOccurrence.toDate())}`
                : ""}
            </span>
            {onOpenItem && (
              <Button variant="ghost" size="sm" onClick={() => onOpenItem(parent)}>
                Edit the recurring item
              </Button>
            )}
          </div>
        )}

        <TextField
          label="Name"
          placeholder={isRecurring ? "Name" : config.oneOff.placeholder}
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
            disabled={Boolean(transaction)}
            onValueChange={(v) => patch({ frequency: v as Frequency })}
          />
          <PaymentMethodField
            methods={methods}
            value={form.paymentMethodId}
            onChange={onSelectMethod}
            createMethod={createMethod}
            onError={setFormError}
          />
        </div>

        <div className="pair">
          <ScheduleFields frequency={form.frequency} value={form} onChange={(p) => patch(p)} />
        </div>

        {offersSpread && (
          <label className="toggle">
            <input
              type="checkbox"
              checked={form.spreadMonthly}
              onChange={(e) => patch({ spreadMonthly: e.currentTarget.checked })}
            />
            <span>
              Reflect it as a monthly amount
              <span className="hint">
                {" "}
                — the graph and the plan count {formatAmount(monthlySlice, effectiveCurrency)} a
                month; the real payment stays in the list
              </span>
            </span>
          </label>
        )}

        <TagsField
          tags={allTags}
          value={form.tags}
          onChange={(ids) => patch({ tags: ids })}
          createTag={createTag}
          onError={setFormError}
        />
        {isRecurring && (
          <label className="toggle">
            <input
              type="checkbox"
              checked={form.inheritTags}
              onChange={(e) => patch({ inheritTags: e.currentTarget.checked })}
            />
            <span>Apply the tags to each payment</span>
          </label>
        )}

        <TextArea
          label="Note (optional)"
          placeholder="Anything worth remembering about it"
          rows={2}
          value={form.note}
          onValueChange={(v) => patch({ note: v })}
        />
        {isRecurring && (
          <label className="toggle">
            <input
              type="checkbox"
              checked={form.inheritNote}
              onChange={(e) => patch({ inheritNote: e.currentTarget.checked })}
            />
            <span>Apply the note to each payment</span>
          </label>
        )}

        {offersBackfill && (
          <label className="toggle">
            <input
              type="checkbox"
              checked={form.applyToExisting}
              onChange={(e) => patch({ applyToExisting: e.currentTarget.checked })}
            />
            <span>
              Also update the existing payments of this item
              <span className="hint"> — payments you edited by hand get overwritten</span>
            </span>
          </label>
        )}

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
              0 = break-even, 100 = doubled. Records a first value check for the account (or the
              &ldquo;No account&rdquo; bucket); refine it on the Investments page any time.
            </p>
          </div>
        )}

        {offersCharged && (
          <>
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
          </>
        )}

        {formError && <p className="form-error">{formError}</p>}

        <div className="actions">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : isRecurring ? "Create" : "Save"}
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

        .parent {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 12px;
          border-radius: var(--r-sm);
          background: var(--bg-2);
          font-size: 0.8rem;
          color: var(--fg-1);
        }

        .parent strong {
          color: var(--fg-0);
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
