import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { PageLayout } from "../../../components/organisms/PageLayout";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { Card } from "../../../components/atoms/Card";
import { CheckboxField } from "../../../components/atoms/CheckboxField";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { CategoryIcon } from "../../../components/atoms/CategoryIcon";
import { CreditCard, Tag as TagIcon } from "../../../components/atoms/Icons";
import { MonthlyBarsChart } from "../../../components/molecules/MonthlyBarsChart";
import type { BarSeries, MonthBar } from "../../../components/molecules/MonthlyBarsChart";
import { CategoryBreakdown } from "../../../components/molecules/CategoryBreakdown";
import { GroupedTotalsList } from "../../../components/molecules/GroupedTotalsList";
import { TransactionsTable } from "../../../components/molecules/TransactionsTable";
import { CURRENCY_COLORS, DEFAULT_MONTH_PERIOD, parseMonthPeriod } from "../../../constants";
import type { MonthPeriod } from "../../../constants";
import { MonthSummary } from "./MonthSummary";
import { WorthSummary } from "./WorthSummary";
import { SegmentedControl } from "../../../components/molecules/SegmentedControl";
import { ChartControls } from "./ChartControls";
import type { StackMode } from "./ChartControls";
import { DEFAULT_DOMAIN_VIEW, ViewTabs, parseDomainView } from "./ViewTabs";
import { useFilterQuery } from "../hooks/useFilterQuery";
import type { DomainView } from "./ViewTabs";
import { CategoryMonthList, categoryMonthRows } from "./CategoryMonthList";
import { CategoryDrilldown } from "./CategoryDrilldown";
import { RecurringChecklist } from "./RecurringChecklist";
import { SubscriptionInsights } from "../../insights/components/SubscriptionInsights";
import { AccountValuePanels } from "../../investments/components/AccountValuePanels";
import { AccountValueList } from "../../investments/components/AccountValueList";
import { useDomainGains } from "../../investments/hooks/useDomainGains";
import {
  gainRowsAsTransactions,
  gainsByCategory,
  unfiledGain,
} from "../../investments/helpers/valuationGains";
import { GAIN_KEY, gainLabel, withGains } from "../helpers/gainStack";
import {
  gainsByCategoryUntil,
  gainsByWindow,
  historyWindows,
  parseChartMeasure,
  parseSummaryScope,
  runningTotals,
  unfiledGainUntil,
  worthLedger,
  worthUntil,
} from "../helpers/worthStack";
import type { ChartMeasure, SummaryScope } from "../helpers/worthStack";
import { isAccountDomain } from "../../../helpers/accounts";
import { convertedAmount } from "../../../helpers/aggregations";
import { INCEPTION, positionSign } from "../../investments/helpers/valuation";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
import {
  expectedForMonth,
  groupByMethod,
  groupByTag,
  monthDelta,
  monthTotals,
  monthKey,
  monthsApart,
  monthTotalsByCurrency,
  monthWindows,
  trailingAverage,
} from "../helpers/months";
import { monthTotalsByCategory } from "../../../helpers/stacks";
import type { StackedTotals } from "../../../helpers/stacks";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useCategories } from "../../../hooks/useCategories";
import { useRecurrentTransactions, markItemPaid } from "../../../hooks/useRecurrentTransactions";
import { usePaymentMethods } from "../../../hooks/usePaymentMethods";
import { useTags } from "../../../hooks/useTags";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { useSelectedMonth } from "../../../hooks/useSelectedMonth";
import { useLocalPreference } from "../../../hooks/useLocalPreference";
import { usePreferences } from "../../../hooks/usePreferences";
import { deleteTransaction } from "../../../hooks/useTransactions";
import { toDate } from "../../../helpers/chartData";
import { hiddenCategoryIds, hiddenItemIds, hiddenRowReasons } from "../../../helpers/hidden";
import { isSyntheticRow, spreadItemIds, spreadTransactions } from "../helpers/spread";
import type { TransactionFilters } from "../helpers/transactionFilters";
import type { Category, Currency, Domain, RecurrentTransaction, Transaction } from "../../../types";
import { useT } from "../../../hooks/useT";
import { COMMON_MESSAGES } from "../../../messages/common";
import { DOMAIN_MESSAGES } from "../messages";

// The form is big and only needed once someone opens it; its own listeners
// (categories, methods, tags…) also only start then.
const RecurrentTransactionModal = dynamic(() =>
  import("./RecurrentTransactionModal").then((m) => m.RecurrentTransactionModal)
);

interface Props {
  domain: Domain;
}

/**
 * Month-first page shared by the five domains. The month comes from the
 * header picker; the summary, the bars and the panel below all speak about
 * it. The month in progress carries what the plan still owes before month end.
 */
export function DomainPage({ domain }: Props) {
  const config = DOMAIN_CONFIG[domain];
  const { ctx, target } = useMoneyContext();
  const { language } = usePreferences();
  const t = useT(DOMAIN_MESSAGES);
  const common = useT(COMMON_MESSAGES);
  const currency: Currency = target;
  // Investments and savings sit in accounts / pockets, which carry value.
  const accountDomain = isAccountDomain(domain) ? domain : null;

  // One clock for the whole app: the windows, "still planned" and the
  // checklist all agree on what "now" is.
  const { now, window } = useSelectedMonth();
  const [period, setPeriod] = useLocalPreference<MonthPeriod>(
    `walleto:chart:${domain}:period`,
    DEFAULT_MONTH_PERIOD,
    parseMonthPeriod
  );
  const [mode, setMode] = useLocalPreference<StackMode>(`walleto:chart:${domain}:mode`, "category");
  const [showHidden, setShowHidden] = useLocalPreference(`walleto:showHidden:${domain}`, false);
  // Investments and savings are about what they hold, so their bars show it
  // by default; the month's activity is one tap away. A debt keeps activity:
  // its balance is not the sum of its rows (the loan itself never was one).
  const offersWorth = domain === "INVESTMENT" || domain === "SAVING";
  const [measure, setMeasure] = useLocalPreference<ChartMeasure>(
    `walleto:chart:${domain}:measure`,
    "worth",
    parseChartMeasure
  );
  const showWorth = offersWorth && measure === "worth";
  // The summary and the Categories view of an account domain can speak about
  // the month's flow or about where the domain stands at its end (the total).
  const [scope, setScope] = useLocalPreference<SummaryScope>(
    `walleto:summary:${domain}:scope`,
    "month",
    parseSummaryScope
  );
  const showTotal = Boolean(accountDomain) && scope === "total";

  // The bars draw `period` months ending with the current one. The figures
  // reach back as far as the header picker does, because the page has to
  // describe whatever month it names — and one more, for the delta. The bars
  // are the tail of that list, so the two never disagree about a month they
  // share, and the chart no longer decides which month the page is about.
  const windows = useMemo(
    () => monthWindows(Math.max(period, monthsApart(window.start, now) + 2), now, language),
    [period, window.start, now, language]
  );
  const chartWindows = useMemo(() => windows.slice(-period), [windows, period]);
  const previousWindow = useMemo(
    () => monthWindows(2, window.start, language)[0],
    [window.start, language]
  );
  const selectedOnChart = chartWindows.some((w) => w.key === window.key);

  const [view, setView] = useState<DomainView>(DEFAULT_DOMAIN_VIEW);
  const [drillCategoryId, setDrillCategoryId] = useState<string | null>(null);
  const [preset, setPreset] = useState<Partial<TransactionFilters> | undefined>(undefined);
  // Activity's search and filters live in the query, so changing month keeps them.
  const filterQuery = useFilterQuery(view);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurrentTransaction | undefined>(undefined);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // The active view lives in the URL hash so a link can point at it.
  useEffect(() => {
    const fromHash = parseDomainView(globalThis.location?.hash.slice(1) ?? "");
    if (fromHash) setView(fromHash);
  }, []);
  const changeView = (next: DomainView) => {
    setView(next);
    setDrillCategoryId(null);
    if (next !== "activity") setPreset(undefined);
    const base = globalThis.location.pathname + globalThis.location.search;
    globalThis.history.replaceState(
      null,
      "",
      next === DEFAULT_DOMAIN_VIEW ? base : `${base}#${next}`
    );
  };

  // Investments and savings read their whole ledger: a value check is
  // measured against everything paid in before it, not just the bars' window.
  // Every figure below filters by month anyway, so nothing else moves.
  const {
    transactions,
    loading: txLoading,
    error: txError,
  } = useDomainTransactions(domain, accountDomain ? INCEPTION : windows[0].start);
  const { items, error: itemsError, remove, update } = useRecurrentTransactions(domain);
  const {
    categories,
    loading: catLoading,
    error: catError,
    update: updateCategory,
  } = useCategories(domain);
  const { methods } = usePaymentMethods();
  const { tags } = useTags();
  const error = txError ?? itemsError ?? catError;

  // Categories hidden from the chart stay out of the bars and the month
  // figure unless the owner flips "Show hidden"; the lists below always show
  // everything, tagged. Hidden from the dashboard is only a tag here.
  const dashboardHiddenItems = useMemo(() => hiddenItemIds(items), [items]);
  const hiddenCategories = useMemo(() => hiddenCategoryIds(categories), [categories]);
  const anythingHidden = hiddenCategories.size > 0;
  const hiddenReasons = (t: Transaction) =>
    hiddenRowReasons(t, {
      dashboardItems: dashboardHiddenItems,
      chartCategories: hiddenCategories,
    });
  // Items asked to be "reflected monthly" chart as one slice per month in
  // place of their real payment (which the ledger and checklist keep).
  // Spread first, then hide: the slices carry the item id and category.
  const spreadIds = useMemo(() => spreadItemIds(items), [items]);
  const planRows = useMemo(
    () => spreadTransactions(items, transactions, windows),
    [items, transactions, windows]
  );
  const chartTransactions = useMemo(
    () => (showHidden ? planRows : planRows.filter((t) => !hiddenCategories.has(t.categoryId))),
    [showHidden, planRows, hiddenCategories]
  );
  // The plan side: spread items are already inside the slices, so they must
  // not be forecast a second time on top.
  const planItems = useMemo(
    () => items.filter((i) => !i.id || !spreadIds.has(i.id)),
    [items, spreadIds]
  );
  const chartItems = useMemo(
    () => (showHidden ? planItems : planItems.filter((i) => !hiddenCategories.has(i.categoryId))),
    [showHidden, planItems, hiddenCategories]
  );

  // A value check is not money moving, but the gain it reports is money the
  // account really holds — so it counts toward the month, on top of what was
  // paid in. Contributions and gain are kept apart so the summary can say
  // which is which.
  const {
    gains,
    rows: gainRows,
    worthRows,
  } = useDomainGains(accountDomain, transactions, !txLoading, categories, ctx, windows);
  // A gain names the category the owner filed it under, so it can travel the
  // same paths a contribution does — one ranking, one "Other" cap, one set of
  // shares. What nobody filed stays a segment of its own.
  const gainLedger = useMemo(
    () => gainRowsAsTransactions(gainRows, ctx, domain, language),
    [gainRows, ctx, domain, language]
  );
  // Chart-scoped on purpose: `withGains` adds its series as soon as one month
  // is non-zero, so a gain in a month the bars do not draw would leave an empty
  // "Gain" segment and legend entry behind.
  const unfiledByMonth = useMemo(() => {
    const out: Record<string, number> = {};
    for (const w of chartWindows) out[w.key] = 0;
    for (const r of gainRows) {
      const key = monthKey(r.at);
      if (!r.categoryId && key in out) out[key] += r.gain;
    }
    return out;
  }, [gainRows, chartWindows]);
  const chartGains = useMemo(
    () => Object.fromEntries(chartWindows.map((w) => [w.key, gains[w.key] ?? 0])),
    [chartWindows, gains]
  );
  const txTotals = useMemo(
    () => monthTotals(chartTransactions, ctx, windows),
    [chartTransactions, ctx, windows]
  );
  const totals = useMemo(
    () =>
      Object.fromEntries(
        windows.map((w) => [w.key, (txTotals[w.key] ?? 0) + (gains[w.key] ?? 0)])
      ) as Record<string, number>,
    [windows, txTotals, gains]
  );
  const inWindow = (t: Transaction) => {
    const d = toDate(t.occurredAt);
    return d >= window.start && d < window.end;
  };
  const monthTransactions = useMemo(
    () => transactions.filter(inWindow),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, window]
  );
  const monthPlanRows = useMemo(
    () => planRows.filter(inWindow),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [planRows, window]
  );
  // The ledger plus this month's share of each "reflected monthly" item: a
  // read-only line that says what the plan counts, next to the real payment.
  const activityRows = useMemo(
    () => [...monthTransactions, ...monthPlanRows.filter(isSyntheticRow)],
    [monthTransactions, monthPlanRows]
  );
  const realized = totals[window.key] ?? 0;
  const contributed = txTotals[window.key] ?? 0;
  const monthGain = gains[window.key] ?? 0;
  // What left the accounts this month, so the summary can show both sides of the net figure.
  const monthWithdrawn = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.direction === "OUT")
        .reduce((sum, t) => sum + Math.abs(convertedAmount(t, ctx)), 0),
    [monthTransactions, ctx]
  );
  const expected = useMemo(
    () => expectedForMonth(window, realized, chartItems, ctx, now),
    [window, realized, chartItems, ctx, now]
  );
  const average = useMemo(() => trailingAverage(totals, chartWindows), [totals, chartWindows]);
  const delta = useMemo(
    () => monthDelta(totals, windows, window.key),
    [totals, windows, window.key]
  );
  // "≈" has to cover the value checks too: one recorded in another currency
  // was converted into the figure just like a transaction.
  const hasForeign = useMemo(
    () =>
      monthTransactions.some((t) => t.currency !== currency) ||
      gainRows.some((r) => monthKey(r.at) === window.key && r.currency !== currency),
    [monthTransactions, currency, gainRows, window.key]
  );

  // One bar per month, stacked by the top categories or by currency, capped
  // with the month's gain — which belongs to neither split, so it rides on top
  // of both. Worth and activity share it: worth is the same stack over the
  // whole history, carried forward month by month.
  const buildStacks = (
    rows: Transaction[],
    filedGains: Transaction[],
    gainsPerWindow: Record<string, number>,
    unfiledPerWindow: Record<string, number>,
    wins: typeof windows,
    fallbackTotals: Record<string, number>
  ): StackedTotals => {
    // By category a filed gain joins its own category's segment, so the bar
    // and Top categories read the same. By currency it cannot: a gain is not
    // denominated in anything, so every gain stays its own segment there.
    const base =
      mode === "currency"
        ? (() => {
            const byCurrency = monthTotalsByCurrency(rows, ctx, wins);
            return {
              totals: byCurrency.totals as Record<string, Record<string, number>>,
              series: byCurrency.currencies.map((c) => ({
                key: c,
                label: c,
                color: CURRENCY_COLORS[c],
              })),
            };
          })()
        : monthTotalsByCategory([...rows, ...filedGains], categories, ctx, wins, {
            domain,
            top: 5,
            language,
          });
    // Nothing to split by (no transactions at all) still needs one series, so
    // a month that is pure gain has something to stack on.
    const withFallback =
      base.series.length > 0
        ? base
        : {
            series: [{ key: "amount", label: t(`spent.${domain}`), color: config.accent }],
            totals: Object.fromEntries(
              wins.map((w) => [w.key, { amount: fallbackTotals[w.key] ?? 0 }])
            ),
          };
    return withGains(
      withFallback,
      mode === "currency" ? gainsPerWindow : unfiledPerWindow,
      gainLabel(domain, language)
    );
  };
  const activityStacks = useMemo(
    () =>
      buildStacks(
        chartTransactions,
        gainLedger,
        chartGains,
        unfiledByMonth,
        chartWindows,
        txTotals
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      mode,
      chartTransactions,
      gainLedger,
      categories,
      ctx,
      chartWindows,
      domain,
      config,
      txTotals,
      chartGains,
      unfiledByMonth,
      language,
    ]
  );
  // Worth reads the real ledger, not the spread slices: a yearly deposit is
  // held from the day it lands. Hidden categories leave with their gains.
  const worthStacks = useMemo(() => {
    if (!showWorth) return null;
    const rows = showHidden
      ? transactions
      : transactions.filter((t) => !hiddenCategories.has(t.categoryId));
    const checks = showHidden
      ? gainRows
      : gainRows.filter((r) => !r.categoryId || !hiddenCategories.has(r.categoryId));
    const history = historyWindows(
      [...rows.map((t) => toDate(t.occurredAt)), ...checks.map((r) => r.at)],
      now,
      chartWindows.length,
      language
    );
    const flow = buildStacks(
      rows,
      gainRowsAsTransactions(checks, ctx, domain, language),
      gainsByWindow(checks, history),
      gainsByWindow(checks, history, true),
      history,
      monthTotals(rows, ctx, history)
    );
    return runningTotals(flow, history);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showWorth,
    showHidden,
    transactions,
    hiddenCategories,
    gainRows,
    now,
    chartWindows.length,
    mode,
    categories,
    ctx,
    domain,
    config,
    language,
  ]);
  const stacks = worthStacks ?? activityStacks;
  const series: BarSeries[] = stacks.series;
  const bars: MonthBar[] = useMemo(
    () =>
      chartWindows.map((w) => ({
        key: w.key,
        label: w.label,
        isCurrent: w.isCurrent,
        ...Object.fromEntries(series.map((s) => [s.key, stacks.totals[w.key]?.[s.key] ?? 0])),
        // The plan is a flow: it has nothing to add on top of a balance.
        ...(!showWorth && w.isCurrent && expected > realized
          ? { planned: expected - realized }
          : {}),
      })),
    [chartWindows, series, stacks, expected, realized, showWorth]
  );

  // The selected month by category, for the side card and the Categories
  // view. The month's filed gains ride along as rows, so a category's total
  // is what it is really worth having held this month.
  const monthGainsByCategory = useMemo(
    () => gainsByCategory(gainRows, window.key),
    [gainRows, window.key]
  );
  const monthUnfiledGain = useMemo(() => unfiledGain(gainRows, window.key), [gainRows, window.key]);
  const categoryRows = useMemo(
    () =>
      categoryMonthRows(
        categories,
        monthPlanRows,
        planItems,
        ctx,
        window,
        now,
        monthGainsByCategory
      ),
    [categories, monthPlanRows, planItems, ctx, window, now, monthGainsByCategory]
  );
  // In worth, Top categories is what each category holds at the end of the
  // month: everything paid in before then plus every gain reported, i.e. how
  // the portfolio is split.
  const worthCategoryRows = useMemo(
    () =>
      showWorth
        ? categoryMonthRows(
            categories,
            transactions.filter((t) => toDate(t.occurredAt) < window.end),
            [],
            ctx,
            window,
            now,
            gainsByCategoryUntil(gainRows, window.end)
          )
        : null,
    [showWorth, categories, transactions, ctx, window, now, gainRows]
  );
  const worthUnfiledGain = useMemo(
    () => (showWorth ? unfiledGainUntil(gainRows, window.end) : 0),
    [showWorth, gainRows, window.end]
  );
  const topCategories = useMemo(() => {
    const source = worthCategoryRows ?? categoryRows;
    const unfiled = worthCategoryRows ? worthUnfiledGain : monthUnfiledGain;
    const whole = worthCategoryRows
      ? worthCategoryRows.reduce((sum, r) => sum + Math.max(0, r.total), 0) + Math.max(0, unfiled)
      : realized;
    const rows = source.slice(0, 6).map((r) => ({
      categoryId: r.category.id ?? r.category.name,
      name: r.category.name,
      amount: r.total,
      percent: r.share,
    }));
    // Gains from checks recorded before the form asked for a category have no
    // row to join, so they get their own rather than quietly going missing.
    if (unfiled === 0) return rows;
    return [
      ...rows,
      {
        categoryId: GAIN_KEY,
        name: gainLabel(domain, language),
        amount: unfiled,
        percent: whole > 0 ? (Math.max(0, unfiled) / whole) * 100 : 0,
      },
    ];
  }, [
    worthCategoryRows,
    worthUnfiledGain,
    categoryRows,
    monthUnfiledGain,
    realized,
    domain,
    language,
  ]);
  // The total: everything held (or owed) at the end of the month — the same
  // running sum as the worth bars, with hidden categories leaving it unless
  // "Show hidden" is on. A debt counts from its first balance check on.
  const ledger = useMemo(
    () => (showTotal ? worthLedger(transactions, worthRows, domain) : []),
    [showTotal, transactions, worthRows, domain]
  );
  const totalSign = accountDomain ? positionSign(accountDomain) : 1;
  const totalHidden = showHidden ? undefined : hiddenCategories;
  const worthNow = useMemo(
    () => (showTotal ? totalSign * worthUntil(ledger, worthRows, window.end, ctx, totalHidden) : 0),
    [showTotal, totalSign, ledger, worthRows, window.end, ctx, totalHidden]
  );
  const worthBefore = useMemo(
    () =>
      showTotal ? totalSign * worthUntil(ledger, worthRows, window.start, ctx, totalHidden) : 0,
    [showTotal, totalSign, ledger, worthRows, window.start, ctx, totalHidden]
  );
  const ledgerUntilEnd = useMemo(
    () => ledger.filter((t) => toDate(t.occurredAt) < window.end),
    [ledger, window.end]
  );
  const worthGainsByCategory = useMemo(
    () => gainsByCategoryUntil(worthRows, window.end),
    [worthRows, window.end]
  );
  const worthUnfiled = useMemo(
    () => unfiledGainUntil(worthRows, window.end),
    [worthRows, window.end]
  );
  const hasForeignEver = useMemo(
    () =>
      showTotal &&
      (ledgerUntilEnd.some((t) => t.currency !== currency) ||
        worthRows.some((r) => r.at < window.end && r.currency !== currency)),
    [showTotal, ledgerUntilEnd, worthRows, window.end, currency]
  );
  const scopeToggle = accountDomain ? (
    <SegmentedControl
      label={t("controls.figuresShow")}
      size="sm"
      options={[
        { key: "month", label: t("controls.month") },
        { key: "total", label: t("controls.total") },
      ]}
      value={scope}
      onChange={setScope}
    />
  ) : undefined;

  const byTag = useMemo(
    () => groupByTag(monthTransactions, tags, ctx, language),
    [monthTransactions, tags, ctx, language]
  );
  const byMethod = useMemo(
    () => groupByMethod(monthTransactions, methods, ctx, language),
    [monthTransactions, methods, ctx, language]
  );

  const openEdit = (item: RecurrentTransaction) => {
    setEditingItem(item);
    setModalOpen(true);
  };
  const withBusy = async (id: string, action: () => Promise<void>, what: string) => {
    setBusyItemId(id);
    try {
      await action();
    } catch (err) {
      console.error(`Failed to ${what}:`, err);
    } finally {
      setBusyItemId(null);
    }
  };
  const toggleItemHidden = (item: RecurrentTransaction) =>
    item.id &&
    withBusy(
      item.id,
      () => update(item.id!, { hiddenFromDashboard: !item.hiddenFromDashboard }),
      "update the item"
    );
  const toggleCategoryHidden = (category: Category) =>
    category.id &&
    updateCategory(category.id, { hiddenFromChart: !category.hiddenFromChart }).catch((err) =>
      console.error("Failed to update category:", err)
    );
  const deleteTx = async (transactionId: string) => {
    setDeletingTxId(transactionId);
    try {
      await deleteTransaction(transactionId);
    } catch (err) {
      console.error("Failed to delete transaction:", err);
    } finally {
      setDeletingTxId(null);
    }
  };
  /** A group row (tag, method) narrows the ledger to it. */
  const narrowTo = (filters: Partial<TransactionFilters>) => {
    setPreset(filters);
    setView("activity");
    setDrillCategoryId(null);
  };

  const drillCategory = categories.find((c) => c.id === drillCategoryId) ?? null;
  const drillIsSubscriptions =
    domain === "EXPENSE" && drillCategory?.name.trim().toLowerCase() === "subscriptions";

  const panel =
    view === "categories" ? (
      drillCategory ? (
        <CategoryDrilldown
          category={drillCategory}
          categories={categories}
          transactions={monthTransactions}
          currency={currency}
          ctx={ctx}
          tags={tags}
          methods={methods}
          items={items}
          monthLabel={window.label}
          loading={txLoading}
          onBack={() => setDrillCategoryId(null)}
          onEdit={setEditingTx}
          hiddenReasons={hiddenReasons}
          onDelete={deleteTx}
          deletingId={deletingTxId}
          extras={
            <>
              {drillIsSubscriptions && (
                <SubscriptionInsights
                  items={items}
                  categories={categories}
                  ctx={ctx}
                  currency={currency}
                />
              )}
              {accountDomain && (
                <AccountValuePanels
                  key={drillCategory.id}
                  domain={accountDomain}
                  category={drillCategory}
                  categories={categories}
                  ctx={ctx}
                  currency={currency}
                />
              )}
            </>
          }
        />
      ) : (
        <CategoryMonthList
          domain={domain}
          categories={categories}
          transactions={showTotal ? ledgerUntilEnd : monthPlanRows}
          gains={showTotal ? worthGainsByCategory : monthGainsByCategory}
          unfiledGain={showTotal ? worthUnfiled : monthUnfiledGain}
          scope={showTotal ? "total" : "month"}
          toolbar={scopeToggle}
          items={planItems}
          ctx={ctx}
          currency={currency}
          window={window}
          now={now}
          loading={txLoading || catLoading}
          onSelect={setDrillCategoryId}
          onToggleHidden={toggleCategoryHidden}
        />
      )
    ) : view === "activity" ? (
      <TransactionsTable
        title={common("noun.activity")}
        subtitle={t("activity.subtitle", { month: window.longLabel })}
        rows={activityRows}
        domain={domain}
        categories={categories}
        methods={methods}
        tags={tags}
        items={items}
        displayCurrency={currency}
        ctx={ctx}
        loading={txLoading}
        onEdit={setEditingTx}
        onOpenItem={openEdit}
        hiddenReasons={hiddenReasons}
        onDelete={deleteTx}
        deletingId={deletingTxId}
        showMethod={config.showPaymentMethod}
        initialFilters={preset ?? filterQuery.initial}
        onFiltersChange={filterQuery.write}
      />
    ) : view === "tags" ? (
      <Card>
        <SectionTitle title={common("noun.tags")} subtitle={t("tags.subtitle")} />
        <GroupedTotalsList
          groups={byTag}
          currency={currency}
          color={config.accent}
          loading={txLoading}
          emptyLabel={t("empty.period")}
          icon={() => <TagIcon size={16} />}
          onSelect={(key) =>
            narrowTo({
              search: key === "__none" ? "" : (tags.find((t) => t.id === key)?.name ?? ""),
            })
          }
        />
      </Card>
    ) : view === "methods" ? (
      <Card>
        <SectionTitle
          title={common("noun.paymentMethods")}
          subtitle={t("methods.subtitle", { month: window.longLabel })}
        />
        <GroupedTotalsList
          groups={byMethod}
          currency={currency}
          color={config.accent}
          loading={txLoading}
          emptyLabel={t("empty.period")}
          icon={() => <CreditCard size={16} />}
          onSelect={(key) => narrowTo({ paymentMethodId: key })}
        />
      </Card>
    ) : view === "value" && accountDomain ? (
      <AccountValueList
        domain={accountDomain}
        categories={categories}
        ctx={ctx}
        currency={currency}
      />
    ) : (
      <RecurringChecklist
        domain={domain}
        items={items}
        transactions={monthTransactions}
        paymentMethods={methods}
        categories={categories}
        tags={tags}
        ctx={ctx}
        currency={currency}
        window={window}
        now={now}
        onMarkPaid={(id) => withBusy(id, () => markItemPaid(id), "mark as paid")}
        onEdit={openEdit}
        onStop={(id) => withBusy(id, () => remove(id), "stop the item")}
        onToggleHidden={toggleItemHidden}
        busyId={busyItemId}
      />
    );

  return (
    <PageLayout
      title={common(`domain.${domain}`)}
      subtitle={t(`page.subtitle.${domain}`)}
      domain={domain}
    >
      {error && <ErrorState error={error} />}

      {showTotal && accountDomain ? (
        <WorthSummary
          domain={accountDomain}
          window={window}
          worth={worthNow}
          previous={worthBefore}
          previousLabel={previousWindow?.longLabel ?? null}
          currency={currency}
          approximate={hasForeignEver}
          hiddenLeftOut={anythingHidden && !showHidden}
          toolbar={scopeToggle}
        />
      ) : (
        <MonthSummary
          toolbar={scopeToggle}
          domain={domain}
          window={window}
          realized={realized}
          expected={expected}
          delta={delta}
          previousLabel={previousWindow?.longLabel ?? null}
          currency={currency}
          approximate={hasForeign}
          contributed={accountDomain ? contributed : undefined}
          gain={accountDomain ? monthGain : undefined}
          withdrawn={accountDomain ? monthWithdrawn : undefined}
        />
      )}

      <div className="charts">
        <Card>
          <SectionTitle
            title={t(`chart.title.${domain}`)}
            subtitle={t(
              showWorth ? `chart.subtitle.worth.${mode}` : `chart.subtitle.${domain}.${mode}`
            )}
          >
            <ChartControls
              period={period}
              onPeriod={setPeriod}
              mode={mode}
              onMode={setMode}
              measure={offersWorth ? measure : undefined}
              onMeasure={offersWorth ? setMeasure : undefined}
            />
          </SectionTitle>
          <MonthlyBarsChart
            data={bars}
            series={series}
            stacked={stacks.series.length > 1}
            currency={currency}
            loading={txLoading}
            average={showWorth ? null : average}
            /* Only when the bars actually draw it — otherwise every bar
               dims and the whole chart greys out. */
            selectedKey={selectedOnChart ? window.key : undefined}
            height={220}
          />
          {anythingHidden && (
            <CheckboxField
              label={t("chart.showHidden")}
              hint={t("chart.showHiddenHint")}
              checked={showHidden}
              onChange={setShowHidden}
            />
          )}
        </Card>
        <CategoryBreakdown
          title={t("chart.topCategories")}
          rows={topCategories}
          categories={categories}
          domain={domain}
          currency={currency}
          onViewAll={() => changeView("categories")}
          loading={txLoading || catLoading}
        />
      </div>

      <div className="detail">
        <ViewTabs
          value={view}
          onChange={changeView}
          accent={config.accent}
          showValue={Boolean(accountDomain)}
          valueLabel={domain === "DEBT" ? common("noun.owed") : undefined}
          showMethods={config.showPaymentMethod}
        />
        {panel}
      </div>

      {modalOpen && (
        <RecurrentTransactionModal
          domain={domain}
          open
          item={editingItem}
          onClose={() => setModalOpen(false)}
        />
      )}
      {editingTx && (
        <RecurrentTransactionModal
          open
          domain={domain}
          transaction={editingTx}
          onOpenItem={(item) => {
            setEditingTx(null);
            openEdit(item);
          }}
          onClose={() => setEditingTx(null)}
        />
      )}

      <style jsx>{`
        .charts {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
          gap: 16px;
          align-items: stretch;
        }

        .detail {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }

        @media (max-width: 900px) {
          .charts {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </PageLayout>
  );
}
