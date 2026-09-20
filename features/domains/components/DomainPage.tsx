import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "../../../components/organisms/PageLayout";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { Card } from "../../../components/atoms/Card";
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
import { ChartControls } from "./ChartControls";
import type { StackMode } from "./ChartControls";
import { ViewTabs, isDomainView } from "./ViewTabs";
import type { DomainView } from "./ViewTabs";
import { CategoryMonthList, categoryMonthRows } from "./CategoryMonthList";
import { CategoryDrilldown } from "./CategoryDrilldown";
import { RecurringChecklist } from "./RecurringChecklist";
import { RecurrentTransactionModal } from "./RecurrentTransactionModal";
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
import { isAccountDomain } from "../../../helpers/accounts";
import { INCEPTION } from "../../investments/helpers/valuation";
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
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useCategories } from "../../../hooks/useCategories";
import { useRecurrentTransactions, markItemPaid } from "../../../hooks/useRecurrentTransactions";
import { usePaymentMethods } from "../../../hooks/usePaymentMethods";
import { useTags } from "../../../hooks/useTags";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { useSelectedMonth } from "../../../hooks/useSelectedMonth";
import { useLocalPreference } from "../../../hooks/useLocalPreference";
import { deleteTransaction } from "../../../hooks/useTransactions";
import { toDate } from "../../../helpers/chartData";
import {
  hiddenCategoryIds,
  hiddenItemIds,
  hiddenRowReason,
  withoutHidden,
} from "../../../helpers/hidden";
import { spreadItemIds, spreadTransactions } from "../helpers/spread";
import type { TransactionFilters } from "../helpers/transactionFilters";
import type { Category, Currency, Domain, RecurrentTransaction, Transaction } from "../../../types";

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
  const currency: Currency = target;
  // Investments and savings sit in accounts / pockets, which carry value.
  const accountDomain = isAccountDomain(domain) ? domain : null;

  // One clock for the whole app: the windows, "still planned" and the
  // checklist all agree on what "now" is.
  const { now, window } = useSelectedMonth();
  const [period, setPeriod] = useLocalPreference<MonthPeriod>(
    `waletto:chart:${domain}:period`,
    DEFAULT_MONTH_PERIOD,
    parseMonthPeriod
  );
  const [mode, setMode] = useLocalPreference<StackMode>(`waletto:chart:${domain}:mode`, "category");
  const [showHidden, setShowHidden] = useLocalPreference(`waletto:showHidden:${domain}`, false);

  // The bars draw `period` months ending with the current one. The figures
  // reach back as far as the header picker does, because the page has to
  // describe whatever month it names — and one more, for the delta. The bars
  // are the tail of that list, so the two never disagree about a month they
  // share, and the chart no longer decides which month the page is about.
  const windows = useMemo(
    () => monthWindows(Math.max(period, monthsApart(window.start, now) + 2), now),
    [period, window.start, now]
  );
  const chartWindows = useMemo(() => windows.slice(-period), [windows, period]);
  const previousWindow = useMemo(() => monthWindows(2, window.start)[0], [window.start]);
  const selectedOnChart = chartWindows.some((w) => w.key === window.key);

  const [view, setView] = useState<DomainView>("transactions");
  const [drillCategoryId, setDrillCategoryId] = useState<string | null>(null);
  const [preset, setPreset] = useState<Partial<TransactionFilters> | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurrentTransaction | undefined>(undefined);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // The active view lives in the URL hash so a link can point at it.
  useEffect(() => {
    const fromHash = globalThis.location?.hash.slice(1);
    if (fromHash && isDomainView(fromHash)) setView(fromHash);
  }, []);
  const changeView = (next: DomainView) => {
    setView(next);
    setDrillCategoryId(null);
    if (next !== "transactions") setPreset(undefined);
    const base = globalThis.location.pathname + globalThis.location.search;
    globalThis.history.replaceState(null, "", next === "transactions" ? base : `${base}#${next}`);
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

  // Hidden recurring items and hidden categories stay out of the bars and
  // the month figure unless the owner flips "Show hidden"; the lists below
  // always show everything, tagged.
  const hiddenItems = useMemo(() => hiddenItemIds(items), [items]);
  const hiddenCategories = useMemo(() => hiddenCategoryIds(categories), [categories]);
  const anythingHidden = hiddenItems.size > 0 || hiddenCategories.size > 0;
  const hiddenReason = (t: Transaction) => hiddenRowReason(t, hiddenItems, hiddenCategories);
  // Items asked to be "reflected monthly" chart as one slice per month in
  // place of their real payment (which the ledger and checklist keep).
  // Spread first, then hide: the slices carry the item id and category.
  const spreadIds = useMemo(() => spreadItemIds(items), [items]);
  const planRows = useMemo(
    () => spreadTransactions(items, transactions, windows),
    [items, transactions, windows]
  );
  const chartTransactions = useMemo(
    () => (showHidden ? planRows : withoutHidden(planRows, hiddenItems, hiddenCategories)),
    [showHidden, planRows, hiddenItems, hiddenCategories]
  );
  // The plan side: spread items are already inside the slices, so they must
  // not be forecast a second time on top.
  const planItems = useMemo(
    () => items.filter((i) => !i.id || !spreadIds.has(i.id)),
    [items, spreadIds]
  );
  const chartItems = useMemo(
    () =>
      showHidden
        ? planItems
        : planItems.filter((i) => !i.hiddenFromDashboard && !hiddenCategories.has(i.categoryId)),
    [showHidden, planItems, hiddenCategories]
  );

  // A value check is not money moving, but the gain it reports is money the
  // account really holds — so it counts toward the month, on top of what was
  // paid in. Contributions and gain are kept apart so the summary can say
  // which is which.
  const { gains, rows: gainRows } = useDomainGains(
    accountDomain,
    transactions,
    !txLoading,
    categories,
    ctx,
    windows
  );
  // A gain names the category the owner filed it under, so it can travel the
  // same paths a contribution does — one ranking, one "Other" cap, one set of
  // shares. What nobody filed stays a segment of its own.
  const gainLedger = useMemo(
    () => gainRowsAsTransactions(gainRows, ctx, domain),
    [gainRows, ctx, domain]
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
  const realized = totals[window.key] ?? 0;
  const contributed = txTotals[window.key] ?? 0;
  const monthGain = gains[window.key] ?? 0;
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
  // of both.
  const stacks = useMemo(() => {
    // By category a filed gain joins its own category's segment, so the bar
    // and Top categories read the same. By currency it cannot: a gain is not
    // denominated in anything, so every gain stays its own segment there.
    const base =
      mode === "currency"
        ? (() => {
            const byCurrency = monthTotalsByCurrency(chartTransactions, ctx, chartWindows);
            return {
              totals: byCurrency.totals as Record<string, Record<string, number>>,
              series: byCurrency.currencies.map((c) => ({
                key: c,
                label: c,
                color: CURRENCY_COLORS[c],
              })),
            };
          })()
        : monthTotalsByCategory(
            [...chartTransactions, ...gainLedger],
            categories,
            ctx,
            chartWindows,
            { domain, top: 5 }
          );
    // Nothing to split by (no transactions at all) still needs one series, so
    // a month that is pure gain has something to stack on.
    const withFallback =
      base.series.length > 0
        ? base
        : {
            series: [{ key: "amount", label: config.spentLabel, color: config.accent }],
            totals: Object.fromEntries(
              chartWindows.map((w) => [w.key, { amount: txTotals[w.key] ?? 0 }])
            ),
          };
    return withGains(
      withFallback,
      mode === "currency" ? chartGains : unfiledByMonth,
      gainLabel(domain)
    );
  }, [
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
  ]);
  const series: BarSeries[] = stacks.series;
  const bars: MonthBar[] = useMemo(
    () =>
      chartWindows.map((w) => ({
        key: w.key,
        label: w.label,
        isCurrent: w.isCurrent,
        ...Object.fromEntries(series.map((s) => [s.key, stacks.totals[w.key]?.[s.key] ?? 0])),
        ...(w.isCurrent && expected > realized ? { planned: expected - realized } : {}),
      })),
    [chartWindows, series, stacks, expected, realized]
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
  const topCategories = useMemo(() => {
    const rows = categoryRows.slice(0, 6).map((r) => ({
      categoryId: r.category.id ?? r.category.name,
      name: r.category.name,
      amount: r.total,
      percent: r.share,
    }));
    // Gains from checks recorded before the form asked for a category have no
    // row to join, so they get their own rather than quietly going missing.
    if (monthUnfiledGain === 0) return rows;
    return [
      ...rows,
      {
        categoryId: GAIN_KEY,
        name: gainLabel(domain),
        amount: monthUnfiledGain,
        percent: realized > 0 ? (monthUnfiledGain / realized) * 100 : 0,
      },
    ];
  }, [categoryRows, monthUnfiledGain, realized, domain]);
  const byTag = useMemo(
    () => groupByTag(monthTransactions, tags, ctx),
    [monthTransactions, tags, ctx]
  );
  const byMethod = useMemo(
    () => groupByMethod(monthTransactions, methods, ctx),
    [monthTransactions, methods, ctx]
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
    setView("transactions");
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
          hiddenReason={hiddenReason}
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
          transactions={monthPlanRows}
          gains={monthGainsByCategory}
          unfiledGain={monthUnfiledGain}
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
    ) : view === "transactions" ? (
      <TransactionsTable
        title="Transactions"
        subtitle={`All ${config.noun.replace(/s$/, "")} transactions in ${window.longLabel}.`}
        rows={monthTransactions}
        domain={domain}
        categories={categories}
        methods={methods}
        tags={tags}
        items={items}
        displayCurrency={currency}
        ctx={ctx}
        loading={txLoading}
        onEdit={setEditingTx}
        hiddenReason={hiddenReason}
        onDelete={deleteTx}
        deletingId={deletingTxId}
        showMethod={config.showPaymentMethod}
        initialFilters={preset}
        resetKey={window.key}
      />
    ) : view === "tags" ? (
      <Card>
        <SectionTitle
          title="Tags"
          subtitle="A payment with several tags counts under each of them."
        />
        <GroupedTotalsList
          groups={byTag}
          currency={currency}
          color={config.accent}
          loading={txLoading}
          emptyLabel="Nothing recorded in this period"
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
          title="Payment methods"
          subtitle={`What was charged where in ${window.longLabel}.`}
        />
        <GroupedTotalsList
          groups={byMethod}
          currency={currency}
          color={config.accent}
          loading={txLoading}
          emptyLabel="Nothing recorded in this period"
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
    <PageLayout title={config.title} subtitle={config.subtitle} domain={domain}>
      {error && <ErrorState error={error} />}

      <MonthSummary
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
      />

      <div className="charts">
        <Card>
          <SectionTitle
            title={`Monthly ${config.noun}`}
            subtitle={`${
              accountDomain
                ? `Actual ${config.noun} and ${domain === "DEBT" ? "accrued interest" : "reported gain"}`
                : `Actual ${config.noun}`
            }, split by ${mode === "category" ? "category" : "currency"}.`}
          >
            <ChartControls period={period} onPeriod={setPeriod} mode={mode} onMode={setMode} />
          </SectionTitle>
          <MonthlyBarsChart
            data={bars}
            series={series}
            stacked={stacks.series.length > 1}
            currency={currency}
            loading={txLoading}
            average={average}
            /* Only when the bars actually draw it — otherwise every bar
               dims and the whole chart greys out. */
            selectedKey={selectedOnChart ? window.key : undefined}
            height={220}
          />
          {anythingHidden && (
            <label className="show-hidden">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.currentTarget.checked)}
              />
              <span>
                Show hidden
                <span className="hint">
                  {" "}
                  — items hidden from the dashboard and categories hidden from the chart
                </span>
              </span>
            </label>
          )}
        </Card>
        <CategoryBreakdown
          title="Top categories"
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
          valueLabel={domain === "DEBT" ? "Balance" : undefined}
          showMethods={config.showPaymentMethod}
        />
        {panel}
      </div>

      <RecurrentTransactionModal
        domain={domain}
        open={modalOpen}
        item={editingItem}
        onClose={() => setModalOpen(false)}
      />
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
        .show-hidden {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--fg-1);
          cursor: pointer;
        }

        .show-hidden input {
          margin-top: 2px;
          flex-shrink: 0;
          accent-color: var(--accent);
        }

        .show-hidden .hint {
          color: var(--fg-2);
        }

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
