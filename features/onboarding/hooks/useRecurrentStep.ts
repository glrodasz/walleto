import { useMemo, useState } from "react";
import { useCategories } from "../../../hooks/useCategories";
import { usePaymentMethods } from "../../../hooks/usePaymentMethods";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { useDraftRows } from "../../../hooks/useDraftRows";
import type { DraftRow } from "../../../hooks/useDraftRows";
import {
  anchorStartDate,
  scheduleChoiceFromStartDate,
  toDateInputValue,
} from "../../../helpers/scheduleAnchor";
import { recurrentPatch } from "../helpers/recurrentPatch";
import { useDecimalInput } from "../../../hooks/useDecimalInput";
import { saveAll } from "../../../utils/saveAll";
import { UserFacingError } from "../../../utils/errorMessage";
import { translate } from "../../../helpers/i18n";
import { usePreferences } from "../../../hooks/usePreferences";
import { ONBOARDING_MESSAGES } from "../messages";
import type { Currency, Domain, Frequency, RecurrentTransactionType } from "../../../types";

export interface RecurrentRow extends DraftRow {
  categoryId: string;
  name: string;
  amount: string;
  currency: Currency;
  frequency: Frequency;
  paymentMethodId: string;
  /** MONTHLY / QUARTERLY / YEARLY / BIWEEKLY: (first) payment day, 1–31. */
  dayOfMonth: number;
  /** BIWEEKLY: the second payment day, 1–31. */
  secondDayOfMonth: number;
  /** YEARLY: month, 0–11. QUARTERLY: first month of the cycle. */
  month: number;
  /** WEEKLY: the date, YYYY-MM-DD. */
  date: string;
}

/**
 * A saved row can be edited, but not emptied: removing it is the way out.
 * The English message, for tests; `save()` throws it in the user's language.
 */
export const SAVED_ROW_ERROR = translate(ONBOARDING_MESSAGES, "en", "recurrent.savedRowError");

/** Sensible default `type` so rows aren't all recorded as OTHER. */
const DEFAULT_TYPE: Partial<Record<Domain, RecurrentTransactionType>> = {
  INCOME: "SALARY",
  SAVING: "SAVINGS_TRANSFER",
};

/**
 * @param defaultCurrency what a freshly added row starts with; each row keeps
 *   its own currency after that (an EUR retainer next to a COP rent is normal).
 */
export function useRecurrentStep(domain: Domain, defaultCurrency: Currency) {
  const { items, loading, create, update, remove } = useRecurrentTransactions(domain);
  const { categories } = useCategories(domain);
  const { methods } = usePaymentMethods();
  const { parse, toInput } = useDecimalInput();
  const { language } = usePreferences();
  const [backfill, setBackfill] = useState(true);

  const saved = useMemo(
    () =>
      items.map((i) => {
        const choice = scheduleChoiceFromStartDate(
          i.startDate.toDate(),
          i.frequency,
          i.secondDayOfMonth
        );
        return {
          id: i.id,
          categoryId: i.categoryId,
          name: i.name,
          amount: toInput(i.amount),
          currency: i.currency,
          frequency: i.frequency,
          paymentMethodId: i.paymentMethodId ?? "",
          dayOfMonth: choice.dayOfMonth ?? 1,
          secondDayOfMonth: choice.secondDayOfMonth ?? 15,
          month: choice.month ?? 0,
          date: choice.date ?? toDateInputValue(new Date()),
        };
      }),
    [items, toInput]
  );

  const draft = useDraftRows<RecurrentRow>(
    () => ({
      categoryId: "",
      name: "",
      amount: "",
      currency: defaultCurrency,
      frequency: "MONTHLY" as Frequency,
      paymentMethodId: "",
      dayOfMonth: 1,
      secondDayOfMonth: 15,
      month: 0,
      date: toDateInputValue(new Date()),
    }),
    { ready: !loading, rows: saved }
  );

  /** Adds a row to a cadence section, pre-set to that section's frequency. */
  const addTo = (frequency: Frequency) => draft.add({ frequency });

  const typeFor = (row: RecurrentRow): RecurrentTransactionType => {
    const category = categories.find((c) => c.id === row.categoryId);
    if (category?.name.trim().toLowerCase() === "subscriptions") return "SUBSCRIPTION";
    return DEFAULT_TYPE[domain] ?? "OTHER";
  };

  const amountOf = (row: RecurrentRow) => parse(row.amount) ?? NaN;

  /** New rows that would be sent; blank or half-filled ones are skipped. */
  const pending = () =>
    draft.rows.filter((row) => !row.id && row.categoryId && row.name.trim() && amountOf(row) > 0);

  /** Saved rows the owner edited here, each with the request that applies it. */
  const edits = () =>
    draft.rows.flatMap((row) => {
      if (!row.id) return [];
      const id = row.id;
      const amount = amountOf(row);
      const item = items.find((i) => i.id === id);
      const patch = item
        ? recurrentPatch(row, item, { amount, type: typeFor(row), backfill })
        : null;
      return patch ? [{ row, send: () => update(id, patch) }] : [];
    });

  /**
   * Persists rows that don't have an id yet and patches the saved ones that
   * changed; returns the number created. Saved rows are checked before any
   * request goes out. The requests go out in parallel; rows that saved keep
   * their id even if another fails, so a retry doesn't duplicate them.
   */
  const save = async () => {
    if (
      draft.rows.some((row) => row.id && !(row.categoryId && row.name.trim() && amountOf(row) > 0))
    ) {
      throw new UserFacingError(
        translate(ONBOARDING_MESSAGES, language, "recurrent.savedRowError")
      );
    }

    const [created, patched] = await Promise.allSettled([
      saveAll(
        pending(),
        (row) => {
          const amount = amountOf(row);
          const startDate = anchorStartDate({
            frequency: row.frequency,
            dayOfMonth: row.dayOfMonth,
            secondDayOfMonth: row.secondDayOfMonth,
            month: row.month,
            date: row.date,
            backfill,
          });

          return create({
            domain,
            categoryId: row.categoryId,
            name: row.name.trim(),
            amount,
            currency: row.currency,
            frequency: row.frequency,
            ...(row.frequency === "BIWEEKLY" ? { secondDayOfMonth: row.secondDayOfMonth } : {}),
            type: typeFor(row),
            startDate: startDate.toISOString(),
            ...(row.paymentMethodId ? { paymentMethodId: row.paymentMethodId } : {}),
          });
        },
        (row, id) => draft.update(row.key, { id })
      ),
      saveAll(
        edits(),
        ({ send }) => send(),
        () => {}
      ),
    ]);
    if (created.status === "rejected") throw created.reason;
    if (patched.status === "rejected") throw patched.reason;
    return created.value;
  };

  /**
   * Removing only from local state would leave the item in Firestore, so
   * it reappeared as soon as the step re-hydrated from the snapshot on the way back.
   */
  const removeAt = (key: string) => {
    const row = draft.rows.find((r) => r.key === key);
    draft.removeAt(key);
    if (row?.id) {
      remove(row.id).catch((err) => console.error("Failed to delete row:", err));
    }
  };

  return {
    ...draft,
    domain,
    addTo,
    removeAt,
    save,
    categories,
    methods,
    defaultCurrency,
    backfill,
    setBackfill,
  };
}
