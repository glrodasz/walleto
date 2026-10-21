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
import { Badge } from "../../../components/atoms/Badge";
import { CheckboxField } from "../../../components/atoms/CheckboxField";
import { InfoTip } from "../../../components/atoms/InfoTip";
import { Info } from "../../../components/atoms/Icons";
import { SegmentedControl } from "../../../components/molecules/SegmentedControl";
import { useCategories } from "../../../hooks/useCategories";
import { usePaymentMethods } from "../../../hooks/usePaymentMethods";
import { useAccounts } from "../../../hooks/useAccounts";
import { useTags } from "../../../hooks/useTags";
import { convertItem, useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { materializeNow } from "../../../hooks/useMaterialize";
import { createTransaction, updateTransaction } from "../../../hooks/useTransactions";
import { createInvestmentValuation } from "../../../hooks/useInvestmentValuations";
import { valueFromGain } from "../../investments/helpers/valuation";
import { FREQ_TO_MONTHS } from "../../../helpers/aggregations";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { directionLabel, isAccountDomain } from "../../../helpers/accounts";
import { isEssential } from "../../../helpers/essential";
import {
  anchorStartDate,
  backfillMonths,
  isSameSchedule,
  scheduleChoiceFromStartDate,
  toDateInputValue,
} from "../../../helpers/scheduleAnchor";
import { CURRENCY_SYMBOL } from "../../../constants";
import { useEnabledCurrencies } from "../../../hooks/useEnabledCurrencies";
import { useDecimalInput } from "../../../hooks/useDecimalInput";
import type {
  Currency,
  Domain,
  Frequency,
  RecurrentTransaction,
  Transaction,
  TransactionDirection,
} from "../../../types";
import { useDateFormat } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import { COMMON_MESSAGES } from "../../../messages/common";
import { DOMAIN_MESSAGES } from "../messages";
import { SLOT, splitSlot } from "../helpers/slot";

const FREQUENCIES: Frequency[] = [
  "ONE_TIME",
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
];

interface Props {
  domain: Domain;
  open: boolean;
  /** Present = edit this recurring item. */
  item?: RecurrentTransaction;
  /** Present = edit this one-off transaction (the frequency stays "One time"). */
  transaction?: Transaction;
  /** Create only: what the frequency starts as ("Log a one-off expense" opens on One time). */
  initialFrequency?: Frequency;
  /** Transaction mode: jump to the recurring item that wrote this row. */
  onOpenItem?: (item: RecurrentTransaction) => void;
  onClose: () => void;
}

interface FormState extends ScheduleValue {
  categoryId: string;
  /** INVESTMENT / SAVING / DEBT only. */
  accountId: string;
  name: string;
  /** The top of the band when `variable`. */
  amount: string;
  /** EXPENSE only: the amount is a band from `amountFloor` to `amount`. */
  variable: boolean;
  amountFloor: string;
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
  /** Create only: anchor the schedule `backfillMonths(frequency)` back so history gets written. */
  backfill: boolean;
  /** Create only, INVESTMENT + ONE_TIME: record how the purchase has done so far. */
  gainPct: string;
  chargedEnabled: boolean;
  chargedAmount: string;
  chargedCurrency: Currency | "";
  /** One-offs on account domains: money in, or a withdrawal (borrowed, on a debt). */
  direction: TransactionDirection;
  /** EXPENSE only: file this under Debts instead — the instalment repays a debt. */
  paysDebt: boolean;
  /** Recurring EXPENSE only: kept in Prospect's emergency mode. null = guessed. */
  essential: boolean | null;
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
  const { formatDate, language } = useDateFormat();
  const { formatAmount } = useMoneyFormat();
  const decimal = useDecimalInput();
  const t = useT(DOMAIN_MESSAGES);
  const common = useT(COMMON_MESSAGES);
  const frequencyOptions = useMemo(
    () => FREQUENCIES.map((f) => ({ value: f, label: common(`frequency.${f}`) })),
    [common]
  );
  const { userDoc } = useUserDoc();
  const { optionsFor } = useEnabledCurrencies();
  const empty: FormState = useMemo(
    () => ({
      categoryId: "",
      accountId: "",
      name: "",
      amount: "",
      variable: false,
      amountFloor: "",
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
      direction: "IN",
      paysDebt: false,
      essential: null,
    }),
    [initialFrequency]
  );

  const [form, setForm] = useState<FormState>(empty);
  // "This pays off a debt": an expense that is really a repayment files under
  // Debts. Offered on create and on a recurring item; a one-off row's domain
  // cannot move, so it records its repayments from the Debts page instead.
  const offersDebtToggle = domain === "EXPENSE" && !transaction;
  const effectiveDomain: Domain = offersDebtToggle && form.paysDebt ? "DEBT" : domain;
  const { categories, create: createCategory } = useCategories(effectiveDomain);
  const { methods, create: createMethod } = usePaymentMethods();
  const hasAccounts = isAccountDomain(effectiveDomain);
  const { accounts, create: createAccount } = useAccounts(hasAccounts ? effectiveDomain : null);
  const { tags: allTags, create: createTag } = useTags();
  const { items, create, update } = useRecurrentTransactions(domain);
  // The row's recurring item — only active ones are listed, so a stopped
  // item leaves the row with nothing to link to.
  const parent = transaction?.recurrentTransactionId
    ? items.find((i) => i.id === transaction.recurrentTransactionId)
    : undefined;

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
        amount: decimal.toInput(transaction.amount),
        variable: transaction.amountFloor !== undefined,
        amountFloor:
          transaction.amountFloor !== undefined ? decimal.toInput(transaction.amountFloor) : "",
        currency: transaction.currency,
        frequency: "ONE_TIME",
        paymentMethodId: transaction.paymentMethodId ?? "",
        tags: transaction.tags ?? [],
        note: transaction.note ?? "",
        date: toDateInputValue(transaction.occurredAt.toDate()),
        backfill: false,
        chargedEnabled: transaction.chargedAmount !== undefined,
        chargedAmount:
          transaction.chargedAmount !== undefined ? decimal.toInput(transaction.chargedAmount) : "",
        chargedCurrency: transaction.chargedCurrency ?? "",
        direction: transaction.direction ?? "IN",
        paysDebt: false,
        essential: null,
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
      amount: decimal.toInput(item.amount),
      variable: item.amountFloor !== undefined,
      amountFloor: item.amountFloor !== undefined ? decimal.toInput(item.amountFloor) : "",
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
      direction: "IN",
      paysDebt: false,
      essential: item.essential ?? null,
    });
  }, [open, item, transaction, empty, decimal]);

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  // Flipping the toggle swaps the category list, so the pick has to move
  // with it: the debt category with the same name, else "Loans", else the
  // first one; and the expense category comes back when it is flipped off.
  const [expenseCategory, setExpenseCategory] = useState<{ id: string; name: string } | null>(null);
  const togglePaysDebt = (on: boolean) => {
    if (on) {
      const current = categories.find((c) => c.id === form.categoryId);
      setExpenseCategory(current?.id ? { id: current.id, name: current.name } : null);
      patch({ paysDebt: true, categoryId: "", accountId: "" });
    } else {
      patch({ paysDebt: false, categoryId: expenseCategory?.id ?? "", accountId: "" });
    }
  };
  useEffect(() => {
    if (!form.paysDebt || form.categoryId || categories.length === 0) return;
    const roots = categories.filter((c) => !c.parentId && c.id && c.domain === effectiveDomain);
    const wanted = expenseCategory?.name.trim().toLowerCase();
    const match =
      roots.find((c) => wanted && c.name.trim().toLowerCase() === wanted) ??
      roots.find((c) => c.name.trim().toLowerCase() === "loans") ??
      roots[0];
    if (match?.id) setForm((f) => ({ ...f, categoryId: match.id! }));
  }, [form.paysDebt, form.categoryId, categories, expenseCategory, effectiveDomain]);

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
  // Only expenses vary; a debt repayment is a fixed instalment.
  const offersVariable = effectiveDomain === "EXPENSE";
  const variableOn = offersVariable && form.variable;
  // A charged pair is what the card actually did on one payment, so it lives
  // on ledger rows only: one-off create and transaction edit. It records a
  // known amount, so it never sits next to a band.
  const offersCharged = !isRecurring && !item && !variableOn;
  // A one-off on an account can go either way; a plan only ever puts money in.
  const accountDomain = isAccountDomain(effectiveDomain) ? effectiveDomain : null;
  const offersDirection = accountDomain !== null && !isRecurring;
  const offersGain =
    !editing && domain === "INVESTMENT" && !isRecurring && form.direction !== "OUT";
  // Yearly, quarterly, weekly…: the plan can show it as a monthly amount.
  const offersSpread = isRecurring && form.frequency !== "MONTHLY";
  const offersEssential = isRecurring && effectiveDomain === "EXPENSE";
  // Unset shows the guess Prospect would make, so the box never lies.
  const essentialChecked =
    form.essential ??
    isEssential(
      { domain: effectiveDomain, type: item?.type, categoryId: form.categoryId },
      categories
    );
  const monthlySlice = (decimal.parse(form.amount) ?? 0) * FREQ_TO_MONTHS[form.frequency];
  const gainPct =
    offersGain && form.gainPct.trim() !== "" ? (decimal.parse(form.gainPct) ?? NaN) : null;

  const submit = async () => {
    const amount = decimal.parse(form.amount) ?? NaN;
    if (!form.categoryId) return setFormError(t("modal.error.category"));
    if (!form.name.trim()) return setFormError(t("modal.error.name"));
    if (!(amount > 0)) return setFormError(t("modal.error.amount"));
    const amountFloor = variableOn ? (decimal.parse(form.amountFloor) ?? NaN) : undefined;
    if (amountFloor !== undefined && !(amountFloor > 0 && amountFloor < amount)) {
      return setFormError(t("modal.error.band"));
    }

    const chargedAmount =
      offersCharged && form.chargedEnabled ? (decimal.parse(form.chargedAmount) ?? NaN) : undefined;
    if (offersCharged && form.chargedEnabled) {
      if (!(chargedAmount! > 0) || !form.chargedCurrency)
        return setFormError(t("modal.error.charged"));
      if (form.chargedCurrency === effectiveCurrency)
        return setFormError(t("modal.error.chargedCurrency"));
    }
    if (gainPct !== null && !Number.isFinite(gainPct)) {
      return setFormError(t("modal.error.gainPct"));
    }

    const schedule = {
      frequency: form.frequency,
      dayOfMonth: form.dayOfMonth,
      secondDayOfMonth: form.secondDayOfMonth,
      month: form.month,
      date: form.date,
    };
    const startDate = anchorStartDate({
      ...schedule,
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
          // Unticking "Amount varies" on a row confirms it: `amount` is the real one now.
          ...(amountFloor !== undefined
            ? amountFloor !== transaction.amountFloor
              ? { amountFloor }
              : {}
            : transaction.amountFloor !== undefined
              ? { amountFloor: null }
              : {}),
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
          ...(offersDirection && form.direction !== (transaction.direction ?? "IN")
            ? { direction: form.direction === "OUT" ? ("OUT" as const) : null }
            : {}),
        };
        if (Object.keys(patch).length > 0) await updateTransaction(transaction.id, patch);
      } else if (item?.id) {
        const twiceMonthly = form.frequency === "BIWEEKLY" ? form.secondDayOfMonth : null;
        // Compare the choice, not the anchored date: an untouched schedule
        // re-anchors to this month and would drop the item's history.
        const scheduleChanged = !isSameSchedule(schedule, {
          frequency: item.frequency,
          startDate: item.startDate.toDate(),
          secondDayOfMonth: item.secondDayOfMonth,
        });
        // Moving to Debts goes first and carries the category and the debt:
        // a PATCH checks both against the item's domain as it stands.
        const converting = offersDebtToggle && form.paysDebt;
        // A repayment is a fixed instalment, so the band goes before the move.
        if (converting && item.amountFloor !== undefined) {
          await update(item.id, { amountFloor: null });
        }
        if (converting) {
          await convertItem(item.id, {
            domain: "DEBT",
            categoryId: form.categoryId,
            ...(form.accountId ? { accountId: form.accountId } : {}),
          });
        }
        await update(item.id, {
          ...(converting ? {} : { categoryId: form.categoryId }),
          ...(hasAccounts && !converting ? { accountId: form.accountId || null } : {}),
          name: form.name.trim(),
          amount,
          ...(amountFloor !== undefined
            ? { amountFloor }
            : item.amountFloor !== undefined && !converting
              ? { amountFloor: null }
              : {}),
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
          ...(offersEssential && form.essential !== null && form.essential !== item.essential
            ? { essential: form.essential }
            : {}),
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
          domain: effectiveDomain,
          categoryId: form.categoryId,
          ...(form.accountId ? { accountId: form.accountId } : {}),
          name: form.name.trim(),
          amount,
          ...(amountFloor !== undefined ? { amountFloor } : {}),
          currency: effectiveCurrency,
          occurredAt: startDate.toISOString(),
          status: "PAID",
          ...(offersDirection && form.direction === "OUT" ? { direction: "OUT" as const } : {}),
          ...(form.paymentMethodId ? { paymentMethodId: form.paymentMethodId } : {}),
          ...(form.tags.length ? { tags: form.tags } : {}),
          ...(form.note.trim() ? { note: form.note.trim() } : {}),
          ...(form.chargedEnabled
            ? { chargedAmount: chargedAmount!, chargedCurrency: form.chargedCurrency as Currency }
            : {}),
        });
      } else {
        await create({
          domain: effectiveDomain,
          categoryId: form.categoryId,
          ...(form.accountId ? { accountId: form.accountId } : {}),
          ...(effectiveDomain === "DEBT" ? { type: "LOAN_PAYMENT" as const } : {}),
          name: form.name.trim(),
          amount,
          ...(amountFloor !== undefined ? { amountFloor } : {}),
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
          ...(offersEssential && form.essential !== null ? { essential: form.essential } : {}),
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
            note: t("modal.valuationNote", { name: form.name.trim() }),
          }).catch((err) => console.error("valuation failed:", err));
        }
      }
      onClose();
    } catch (err) {
      console.error("Failed to save recurrent transaction:", err);
      setFormError(t("modal.error.save"));
    } finally {
      setBusy(false);
    }
  };

  const backfill = backfillMonths(form.frequency);
  const backfillLabel =
    backfill % 12 === 0
      ? t("modal.backfillYears", { count: backfill / 12 })
      : t("modal.backfillMonths", { count: backfill });
  const [partOfBefore, partOfAfter] = splitSlot(t("modal.partOf", { name: SLOT }));

  return (
    <Modal
      open={open}
      title={
        editing
          ? form.name
            ? t("modal.edit", { name: form.name })
            : t(`modal.editNoun.${domain}`)
          : isRecurring
            ? t(`plan.add.${domain}`)
            : t(`oneOff.title.${domain}`)
      }
      onClose={onClose}
    >
      <div className="form">
        {offersDebtToggle && (
          <CheckboxField
            label={t("modal.paysDebt")}
            hint={t("modal.paysDebtHint")}
            checked={form.paysDebt}
            onChange={togglePaysDebt}
          />
        )}

        <CategoryField
          categories={categories}
          value={form.categoryId}
          onChange={(categoryId) => patch({ categoryId })}
          createCategory={(name, icon) => createCategory({ domain: effectiveDomain, name, icon })}
          newLabel={t(`modal.newCategory.${effectiveDomain}`)}
          onError={setFormError}
        />

        {hasAccounts && accountDomain && (
          <AccountField
            domain={accountDomain}
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
              {partOfBefore}
              <strong>{parent.name}</strong>
              {partOfAfter} · {common(`frequency.${parent.frequency}`)}
              {parent.nextOccurrence
                ? ` · ${t("plan.next", { date: formatDate(parent.nextOccurrence.toDate(), "day") })}`
                : ""}
            </span>
            {onOpenItem && (
              <Button variant="ghost" size="sm" onClick={() => onOpenItem(parent)}>
                {t("modal.editItem")}
              </Button>
            )}
          </div>
        )}

        <TextField
          label={common("noun.name")}
          placeholder={isRecurring ? common("noun.name") : t(`oneOff.placeholder.${domain}`)}
          value={form.name}
          onValueChange={(v) => patch({ name: v })}
        />

        {offersDirection && accountDomain && (
          <SegmentedControl<TransactionDirection>
            label={t("modal.direction")}
            size="sm"
            options={[
              { key: "IN", label: directionLabel(accountDomain, "IN", language) },
              { key: "OUT", label: directionLabel(accountDomain, "OUT", language) },
            ]}
            value={form.direction}
            onChange={(direction) => patch({ direction })}
          />
        )}

        <div className={variableOn ? "trio" : "pair"}>
          {variableOn && (
            <TextField
              label={t("modal.amountFrom")}
              placeholder="0"
              inputMode="decimal"
              prefix={CURRENCY_SYMBOL[effectiveCurrency]}
              align="right"
              value={form.amountFloor}
              onValueChange={(v) => patch({ amountFloor: decimal.sanitize(v) })}
            />
          )}
          <TextField
            label={variableOn ? t("modal.amountUpTo") : common("noun.amount")}
            placeholder="0"
            inputMode="decimal"
            prefix={CURRENCY_SYMBOL[effectiveCurrency]}
            align="right"
            value={form.amount}
            onValueChange={(v) => patch({ amount: decimal.sanitize(v) })}
          />
          <Select
            label={common("noun.currency")}
            options={optionsFor(effectiveCurrency)}
            value={effectiveCurrency}
            onValueChange={(v) => patch({ currency: v as Currency })}
          />
        </div>

        {offersVariable && !(offersCharged && form.chargedEnabled) && (
          <CheckboxField
            label={t("modal.variable")}
            hint={
              transaction?.amountFloor !== undefined
                ? t("modal.variableHintRow")
                : t("modal.variableHint")
            }
            checked={form.variable}
            onChange={(variable) => patch({ variable })}
          />
        )}

        <div className="pair">
          <Select
            label={common("noun.frequency")}
            options={frequencyOptions}
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
          <CheckboxField
            label={t("modal.spread")}
            info={t("modal.spreadHint", { amount: formatAmount(monthlySlice, effectiveCurrency) })}
            checked={form.spreadMonthly}
            onChange={(spreadMonthly) => patch({ spreadMonthly })}
          />
        )}

        {offersEssential && (
          <CheckboxField
            label={t("modal.essential")}
            hint={t("modal.essentialHint")}
            tag={
              form.essential === null ? (
                <InfoTip
                  label={t("modal.guessedWhy")}
                  trigger={
                    <Badge variant="outline" caps size="sm" icon={<Info size={10} />}>
                      {t("modal.guessed")}
                    </Badge>
                  }
                >
                  {essentialChecked ? t("modal.guessedOn") : t("modal.guessedOff")}
                </InfoTip>
              ) : undefined
            }
            checked={essentialChecked}
            onChange={(essential) => patch({ essential })}
          />
        )}

        <TagsField
          tags={allTags}
          value={form.tags}
          onChange={(ids) => patch({ tags: ids })}
          createTag={createTag}
          onError={setFormError}
        />
        {isRecurring && (
          <CheckboxField
            label={t("modal.inheritTags")}
            checked={form.inheritTags}
            onChange={(inheritTags) => patch({ inheritTags })}
          />
        )}

        <TextArea
          label={t("modal.noteLabel")}
          placeholder={t("modal.notePlaceholder")}
          rows={2}
          value={form.note}
          onValueChange={(v) => patch({ note: v })}
        />
        {isRecurring && (
          <CheckboxField
            label={t("modal.inheritNote")}
            checked={form.inheritNote}
            onChange={(inheritNote) => patch({ inheritNote })}
          />
        )}

        {offersBackfill && (
          <CheckboxField
            label={t("modal.applyToExisting")}
            hint={t("modal.applyToExistingHint")}
            checked={form.applyToExisting}
            onChange={(applyToExisting) => patch({ applyToExisting })}
          />
        )}

        {!item && isRecurring && (
          <CheckboxField
            label={backfillLabel}
            hint={t("modal.backfillHint")}
            checked={form.backfill}
            onChange={(backfill) => patch({ backfill })}
          />
        )}

        {offersGain && (
          <div className="pair">
            <TextField
              label={t("modal.gainPct")}
              placeholder="0"
              inputMode="decimal"
              align="right"
              hint={t("modal.gainPctHint")}
              value={form.gainPct}
              onValueChange={(v) => patch({ gainPct: decimal.sanitize(v, { negative: true }) })}
            />
          </div>
        )}

        {offersCharged && (
          <>
            <CheckboxField
              label={t("modal.charged")}
              info={t("modal.chargedHint")}
              checked={form.chargedEnabled}
              onChange={(chargedEnabled) => patch({ chargedEnabled })}
            />

            {form.chargedEnabled && (
              <div className="pair">
                <TextField
                  label={t("modal.chargedAmount")}
                  placeholder="0"
                  inputMode="decimal"
                  align="right"
                  value={form.chargedAmount}
                  onValueChange={(v) => patch({ chargedAmount: decimal.sanitize(v) })}
                />
                <Select
                  label={t("modal.chargedCurrency")}
                  placeholder={common("noun.currency")}
                  options={optionsFor(form.chargedCurrency).filter(
                    (c) => c.value !== effectiveCurrency
                  )}
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
            {common("action.cancel")}
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy
              ? common("action.saving")
              : editing
                ? t("modal.saveChanges")
                : isRecurring
                  ? t("modal.addToPlan")
                  : common("action.save")}
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

        .trio {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }

        .parent {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 12px;
          border-radius: var(--r-md);
          background: var(--glass-inset);
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

          /* From and Up to stay side by side; the currency drops below. */
          .trio {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </Modal>
  );
}
