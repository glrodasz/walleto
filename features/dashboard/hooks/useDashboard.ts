import { useMemo } from "react";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useUpcomingItems } from "./useUpcomingItems";
import { useCategories } from "../../../hooks/useCategories";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { useSelectedMonth } from "../../../hooks/useSelectedMonth";
import { groupByCategory, computeMoM, computeFlow, shareByCurrency } from "../../../helpers";
import type { MoneyContext } from "../../../helpers";
import { hiddenItemIds, withoutHidden } from "../../../helpers/hidden";
import { monthWindows } from "../../domains/helpers/months";
import { cashFlowSeries } from "../helpers/cashFlowSeries";
import type { CashFlowGroupBy } from "../helpers/cashFlowSeries";
import type { Domain, Transaction } from "../../../types";

interface Options {
  /** Months on the cash-flow chart, ending with the current one. */
  period: number;
  groupBy: CashFlowGroupBy;
}

function buildCategoryList(
  items: ReturnType<typeof useRecurrentTransactions>["items"],
  categories: ReturnType<typeof useCategories>["categories"],
  ctx: MoneyContext
) {
  const grouped = groupByCategory(items, ctx);
  const total = Object.values(grouped).reduce((a, b) => a + b, 0);
  return Object.entries(grouped)
    .map(([categoryId, amount]) => ({
      categoryId,
      name: categories.find((c) => c.id === categoryId)?.name ?? "Unknown",
      amount,
      percent: total === 0 ? 0 : (amount / total) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/** The owner's "hide from dashboard": out of every number and list here. */
const visible = <T extends { hiddenFromDashboard?: boolean }>(rows: T[]) =>
  rows.filter((r) => !r.hiddenFromDashboard);

export function useDashboard({ period, groupBy }: Options) {
  const { now, selectedKey, window } = useSelectedMonth();
  const { items: allIncomes, loading: l1, error: e1 } = useRecurrentTransactions("INCOME");
  const { items: allExpenses, loading: l2, error: e2 } = useRecurrentTransactions("EXPENSE");
  const { items: allInvestments, loading: l3, error: e3 } = useRecurrentTransactions("INVESTMENT");
  const { items: allSavings, loading: l7, error: e7 } = useRecurrentTransactions("SAVING");
  const incomes = useMemo(() => visible(allIncomes), [allIncomes]);
  const expenses = useMemo(() => visible(allExpenses), [allExpenses]);
  const investments = useMemo(() => visible(allInvestments), [allInvestments]);
  const savings = useMemo(() => visible(allSavings), [allSavings]);
  const { categories, loading: l4, error: e4 } = useCategories();
  // Hidden is a property of the recurring item; its ledger rows follow it.
  const hiddenItems = useMemo(
    () => hiddenItemIds([...allIncomes, ...allExpenses, ...allInvestments, ...allSavings]),
    [allIncomes, allExpenses, allInvestments, allSavings]
  );
  const { items: upcoming, loading: l6, error: e6, markPaid } = useUpcomingItems(5);

  // The chart's months always end with the current one; the selected month
  // is highlighted, and the query reaches back far enough to include it.
  const windows = useMemo(() => monthWindows(period, now), [period, now]);
  const chartStart = useMemo(
    () => (window.start < windows[0].start ? window.start : windows[0].start),
    [window.start, windows]
  );
  const income = useDomainTransactions("INCOME", chartStart);
  const expense = useDomainTransactions("EXPENSE", chartStart);
  const investment = useDomainTransactions("INVESTMENT", chartStart);
  const saving = useDomainTransactions("SAVING", chartStart);
  const txByDomain = useMemo<Record<Domain, Transaction[]>>(
    () => ({
      INCOME: withoutHidden(income.transactions, hiddenItems),
      EXPENSE: withoutHidden(expense.transactions, hiddenItems),
      INVESTMENT: withoutHidden(investment.transactions, hiddenItems),
      SAVING: withoutHidden(saving.transactions, hiddenItems),
    }),
    [
      income.transactions,
      expense.transactions,
      investment.transactions,
      saving.transactions,
      hiddenItems,
    ]
  );
  const { ctx, target, fxStale, fxMissing, setDisplayCurrency } = useMoneyContext();
  const loading =
    l1 ||
    l2 ||
    l3 ||
    l4 ||
    l6 ||
    l7 ||
    income.loading ||
    expense.loading ||
    investment.loading ||
    saving.loading;
  const error =
    e1 ??
    e2 ??
    e3 ??
    e4 ??
    e6 ??
    e7 ??
    income.error ??
    expense.error ??
    investment.error ??
    saving.error;

  // "≈" only means something when conversion actually happened: at least one
  // item lives in a currency other than the reporting target.
  const hasForeign = [incomes, expenses, investments, savings].some((arr) =>
    arr.some((i) => i.currency !== target)
  );

  const flow = useMemo(
    () =>
      computeFlow(
        { INCOME: incomes, EXPENSE: expenses, INVESTMENT: investments, SAVING: savings },
        ctx
      ),
    [incomes, expenses, investments, savings, ctx]
  );

  const totals = useMemo(
    () => ({
      income: flow.income,
      expense: flow.expenses,
      investment: flow.investments,
      saving: flow.savings,
    }),
    [flow]
  );

  const expensesByCategory = useMemo(
    () => buildCategoryList(expenses, categories, ctx),
    [expenses, categories, ctx]
  );
  const incomesByCategory = useMemo(
    () => buildCategoryList(incomes, categories, ctx),
    [incomes, categories, ctx]
  );
  const investmentsByCategory = useMemo(
    () => buildCategoryList(investments, categories, ctx),
    [investments, categories, ctx]
  );
  const savingsByCategory = useMemo(
    () => buildCategoryList(savings, categories, ctx),
    [savings, categories, ctx]
  );

  const currencyMix = useMemo(
    () => ({
      income: shareByCurrency(incomes, ctx),
      expense: shareByCurrency(expenses, ctx),
      investment: shareByCurrency(investments, ctx),
      saving: shareByCurrency(savings, ctx),
    }),
    [incomes, expenses, investments, savings, ctx]
  );

  const momDelta = useMemo(
    () => computeMoM(txByDomain.EXPENSE, { ...ctx, domain: "EXPENSE", now }),
    [txByDomain.EXPENSE, ctx, now]
  );

  const cashFlow = useMemo(
    () => cashFlowSeries(txByDomain, categories, ctx, windows, { groupBy, top: 5 }),
    [txByDomain, categories, ctx, windows, groupBy]
  );

  return {
    currency: target,
    fxStale,
    fxMissing,
    approximate: hasForeign && !fxMissing,
    fxUnavailable: hasForeign && fxMissing,
    setDisplayCurrency,
    totals,
    flow,
    expensesByCategory,
    incomesByCategory,
    investmentsByCategory,
    savingsByCategory,
    currencyMix,
    categories,
    upcoming,
    markPaid,
    momDelta,
    cashFlow,
    windows,
    selectedKey,
    window,
    loading,
    error,
  };
}
