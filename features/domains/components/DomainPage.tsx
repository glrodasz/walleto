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
import { CURRENCY_COLORS } from "../../../constants";
import { MonthSummary } from "./MonthSummary";
import { ChartControls } from "./ChartControls";
import type { ChartPeriod, StackMode } from "./ChartControls";
import { ViewTabs, isDomainView } from "./ViewTabs";
import type { DomainView } from "./ViewTabs";
import { CategoryMonthList, categoryMonthRows } from "./CategoryMonthList";
import { CategoryDrilldown } from "./CategoryDrilldown";
import { RecurringChecklist } from "./RecurringChecklist";
import { RecurrentTransactionModal } from "./RecurrentTransactionModal";
import { SubscriptionInsights } from "../../insights/components/SubscriptionInsights";
import { AccountValuePanels } from "../../investments/components/AccountValuePanels";
import { AccountValueList } from "../../investments/components/AccountValueList";
import { ValuationRows } from "../../investments/components/ValuationRows";
import { isAccountDomain } from "../../../helpers/accounts";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
import {
  expectedForMonth,
  groupByMethod,
  groupByTag,
  monthDelta,
  monthTotals,
  monthTotalsByCurrency,
  monthWindows,
  trailingAverage,
} from "../helpers/months";
import { monthTotalsByCategory } from "../../../helpers/stacks";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useCategories } from "../../../hooks/useCategories";
import { useRecurrentTransactions, markItemPaid } from "../../../hooks/useRecurrentTransactions";
import { usePaymentMethods } from "../../../hooks/usePaymentMethods";
import { useAccounts } from "../../../hooks/useAccounts";
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
 * Month-first page shared by the four domains. The month comes from the
 * header picker; the summary, the bars and the panel below all speak about
 * it. The month in progress carries what the plan still owes before month end.
 */
export function DomainPage({ domain }: Props) {
  const config = DOMAIN_CONFIG[domain];
  const { ctx, target } = useMoneyContext();
  const currency: Currency = target;
  // Investments and savings sit in accounts / pockets, which carry value.
  const accountDomain = isAccountDomain(domain) ? domain : null;
  const { accounts } = useAccounts(accountDomain);

  // One clock for the whole app: the windows, "still planned" and the
  // checklist all agree on what "now" is.
  const { now, selectedKey, select } = useSelectedMonth();
  const [period, setPeriod] = useLocalPreference<ChartPeriod>(`waletto:chart:${domain}:period`, 7);
  const [mode, setMode] = useLocalPreference<StackMode>(`waletto:chart:${domain}:mode`, "category");
  const [showHidden, setShowHidden] = useLocalPreference(`waletto:showHidden:${domain}`, false);
  const windows = useMemo(() => monthWindows(period, now), [period, now]);

  // The bars always end with the current month; a month older than the
  // window clamps to its first bar, and the header follows.
  const effectiveKey = selectedKey < windows[0].key ? windows[0].key : selectedKey;
  useEffect(() => {
    if (effectiveKey !== selectedKey) select(effectiveKey);
  }, [effectiveKey, selectedKey, select]);
  const window = windows.find((w) => w.key === effectiveKey) ?? windows[windows.length - 1];
  const windowIndex = windows.indexOf(window);
  const previousWindow = windowIndex > 0 ? windows[windowIndex - 1] : null;

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

  const {
    transactions,
    loading: txLoading,
    error: txError,
  } = useDomainTransactions(domain, windows[0].start);
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

  const totals = useMemo(
    () => monthTotals(chartTransactions, ctx, windows),
    [chartTransactions, ctx, windows]
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
  const expected = useMemo(
    () => expectedForMonth(window, realized, chartItems, ctx, now),
    [window, realized, chartItems, ctx, now]
  );
  const average = useMemo(() => trailingAverage(totals, windows), [totals, windows]);
  const delta = useMemo(
    () => monthDelta(totals, windows, window.key),
    [totals, windows, window.key]
  );
  const hasForeign = useMemo(
    () => monthTransactions.some((t) => t.currency !== currency),
    [monthTransactions, currency]
  );

  // One bar per month, stacked by the top categories or by currency.
  const stacks = useMemo(() => {
    if (mode === "currency") {
      const byCurrency = monthTotalsByCurrency(chartTransactions, ctx, windows);
      return {
        totals: byCurrency.totals as Record<string, Record<string, number>>,
        series: byCurrency.currencies.map((c) => ({ key: c, label: c, color: CURRENCY_COLORS[c] })),
      };
    }
    return monthTotalsByCategory(chartTransactions, categories, ctx, windows, { domain, top: 5 });
  }, [mode, chartTransactions, categories, ctx, windows, domain]);
  const series: BarSeries[] =
    stacks.series.length > 0
      ? stacks.series
      : [{ key: "amount", label: config.spentLabel, color: config.accent }];
  const bars: MonthBar[] = useMemo(
    () =>
      windows.map((w) => ({
        key: w.key,
        label: w.label,
        isCurrent: w.isCurrent,
        ...(stacks.series.length > 0
          ? Object.fromEntries(
              stacks.series.map((s) => [s.key, stacks.totals[w.key]?.[s.key] ?? 0])
            )
          : { amount: totals[w.key] ?? 0 }),
        ...(w.isCurrent && expected > realized ? { planned: expected - realized } : {}),
      })),
    [windows, stacks, totals, expected, realized]
  );

  // The selected month by category, for the side card and the Categories view.
  const categoryRows = useMemo(
    () => categoryMonthRows(categories, monthPlanRows, planItems, ctx, window, now),
    [categories, monthPlanRows, planItems, ctx, window, now]
  );
  const topCategories = useMemo(
    () =>
      categoryRows.slice(0, 6).map((r) => ({
        categoryId: r.category.id ?? r.category.name,
        name: r.category.name,
        amount: r.total,
        percent: r.share,
      })),
    [categoryRows]
  );
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
      <>
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
        {accountDomain && (
          <ValuationRows
            categories={categories}
            accounts={accounts}
            start={window.start}
            end={window.end}
          />
        )}
      </>
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
      />

      <div className="charts">
        <Card>
          <SectionTitle
            title={`Monthly ${config.noun}`}
            subtitle={`Actual ${config.noun}, split by ${mode === "category" ? "category" : "currency"}.`}
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
            selectedKey={window.key}
            onSelect={select}
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
