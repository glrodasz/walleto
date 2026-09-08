import { useMemo } from "react";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useRecentTransactions } from "./useRecentTransactions";
import { useUpcomingItems } from "./useUpcomingItems";
import { useCategories } from "../../../hooks/useCategories";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { groupByCategory, computeMoM, computeFlow } from "../../../helpers";
import type { MoneyContext } from "../../../helpers";
import { toFlowSeries } from "../../../helpers/chartData";

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

export function useDashboard() {
  const { items: allIncomes, loading: l1, error: e1 } = useRecurrentTransactions("INCOME");
  const { items: allExpenses, loading: l2, error: e2 } = useRecurrentTransactions("EXPENSE");
  const { items: allInvestments, loading: l3, error: e3 } = useRecurrentTransactions("INVESTMENT");
  const { items: allSavings, loading: l7, error: e7 } = useRecurrentTransactions("SAVING");
  const incomes = useMemo(() => visible(allIncomes), [allIncomes]);
  const expenses = useMemo(() => visible(allExpenses), [allExpenses]);
  const investments = useMemo(() => visible(allInvestments), [allInvestments]);
  const savings = useMemo(() => visible(allSavings), [allSavings]);
  const { categories, loading: l4, error: e4 } = useCategories();
  const { transactions: recentPayments, loading: l5, error: e5 } = useRecentTransactions(5);
  const { items: upcoming, loading: l6, error: e6, markPaid } = useUpcomingItems(5);
  // One window serves both consumers: the cash-flow chart wants the 6 months
  // the materializer backfills, and computeMoM slices its own current/previous
  // months out of the same set — so the previous month is never truncated and
  // other domains never pollute the delta.
  const chartStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 6, 1);
  }, []);
  const {
    transactions: allExpenseTransactions,
    loading: l8,
    error: e8,
  } = useDomainTransactions("EXPENSE", chartStart);
  const {
    transactions: allIncomeTransactions,
    loading: l9,
    error: e9,
  } = useDomainTransactions("INCOME", chartStart);
  const expenseTransactions = useMemo(
    () => visible(allExpenseTransactions),
    [allExpenseTransactions]
  );
  const incomeTransactions = useMemo(() => visible(allIncomeTransactions), [allIncomeTransactions]);
  const { ctx, target, fxStale, fxMissing, setDisplayCurrency } = useMoneyContext();
  const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9;
  const error = e1 ?? e2 ?? e3 ?? e4 ?? e5 ?? e6 ?? e7 ?? e8 ?? e9;

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

  const momDelta = useMemo(
    () => computeMoM(expenseTransactions, { ...ctx, domain: "EXPENSE" }),
    [expenseTransactions, ctx]
  );

  // One bar per month. The month in progress is flagged so the chart draws
  // it lighter: with a salary on the 23rd it holds almost nothing until
  // then, and a line through that point read as income collapsing.
  const flowSeries = useMemo(
    () =>
      toFlowSeries([...incomeTransactions, ...expenseTransactions], {
        ...ctx,
        from: chartStart,
        bucket: "month",
      }).map((point, i) => {
        const start = new Date(chartStart.getFullYear(), chartStart.getMonth() + i, 1);
        const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
        const nextStart = new Date(start.getFullYear(), start.getMonth() + 1, 1);
        return {
          key,
          label: point.label,
          income: point.income,
          expense: point.expense,
          net: point.income - point.expense,
          isCurrent: nextStart > new Date(),
        };
      }),
    [incomeTransactions, expenseTransactions, ctx, chartStart]
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
    recentPayments,
    upcoming,
    markPaid,
    momDelta,
    flowSeries,
    loading,
    error,
  };
}
