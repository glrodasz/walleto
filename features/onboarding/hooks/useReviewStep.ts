import { useMemo } from "react";
import { useCategories } from "../../../hooks/useCategories";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { computeFlow } from "../../../helpers/aggregations";
import { hasForeignCurrency, sortPlanItems } from "../helpers/planPreview";
import type { Category, RecurrentTransaction } from "../../../types";

export interface PlanGroup {
  domain: "INCOME" | "EXPENSE";
  title: string;
  /** The wizard step that edits it. */
  href: string;
  items: RecurrentTransaction[];
  categories: Category[];
}

/**
 * The plan as saved by the Income and Expenses steps, read back the way the
 * dashboard will: the same `computeFlow` the hero runs, in the currency the
 * Currencies step chose. Only what repeats is a plan — one-offs went to the
 * ledger and are not part of it.
 */
export function useReviewStep() {
  const income = useRecurrentTransactions("INCOME");
  const expense = useRecurrentTransactions("EXPENSE");
  const { categories: incomeCategories } = useCategories("INCOME");
  const { categories: expenseCategories } = useCategories("EXPENSE");
  const { ctx, target } = useMoneyContext();

  const flow = useMemo(
    () => computeFlow({ INCOME: income.items, EXPENSE: expense.items }, ctx),
    [income.items, expense.items, ctx]
  );

  const groups: PlanGroup[] = useMemo(
    () => [
      {
        domain: "INCOME",
        title: "Income in your plan",
        href: "/onboarding/incomes",
        items: sortPlanItems(income.items, ctx),
        categories: incomeCategories,
      },
      {
        domain: "EXPENSE",
        title: "Expenses in your plan",
        href: "/onboarding/expenses",
        items: sortPlanItems(expense.items, ctx),
        categories: expenseCategories,
      },
    ],
    [income.items, expense.items, incomeCategories, expenseCategories, ctx]
  );

  return {
    loading: income.loading || expense.loading,
    error: income.error ?? expense.error,
    flow,
    ctx,
    currency: target,
    approximate: hasForeignCurrency([...income.items, ...expense.items], target),
    groups,
  };
}
