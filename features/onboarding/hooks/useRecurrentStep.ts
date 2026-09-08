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
import { sectionFor } from "../helpers/cadenceSections";
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
  /** ONE_TIME / WEEKLY: the date, YYYY-MM-DD. */
  date: string;
}

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
  const { items, loading, create, remove } = useRecurrentTransactions(domain);
  const { categories } = useCategories(domain);
  const { methods } = usePaymentMethods();
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
          amount: String(i.amount),
          currency: i.currency,
          frequency: i.frequency,
          paymentMethodId: i.paymentMethodId ?? "",
          dayOfMonth: choice.dayOfMonth ?? 1,
          secondDayOfMonth: choice.secondDayOfMonth ?? 15,
          month: choice.month ?? 0,
          date: choice.date ?? toDateInputValue(new Date()),
        };
      }),
    [items]
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

  /** Persists rows that don't have an id yet; returns the number created. */
  const save = async () => {
    let created = 0;
    for (const row of draft.rows) {
      const amount = Number(row.amount);
      // Skip rows the user left blank or only partially filled.
      if (row.id || !row.categoryId || !row.name.trim() || !(amount > 0)) continue;

      const startDate = anchorStartDate({
        frequency: row.frequency,
        dayOfMonth: row.dayOfMonth,
        secondDayOfMonth: row.secondDayOfMonth,
        month: row.month,
        date: row.date,
        backfill: backfill && sectionFor(row.frequency).recurring,
      });

      const id = await create({
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
      draft.update(row.key, { id });
      created++;
    }
    return created;
  };

  /**
   * Removing only from local state would leave the transaction in Firestore, so
   * it reappeared as soon as the step re-hydrated from the snapshot on the way back.
   */
  const removeAt = (key: string) => {
    const row = draft.rows.find((r) => r.key === key);
    draft.removeAt(key);
    if (row?.id) {
      remove(row.id).catch((err) => console.error("Failed to delete recurrent transaction:", err));
    }
  };

  return {
    ...draft,
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
