import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "../../../components/organisms/PageLayout";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { Card } from "../../../components/atoms/Card";
import { MonthlyBarsChart } from "../../../components/molecules/MonthlyBarsChart";
import type { BarSeries, MonthBar } from "../../../components/molecules/MonthlyBarsChart";
import { CURRENCY_COLORS } from "../../../constants";
import { MonthHeader } from "./MonthHeader";
import { ViewTabs } from "./ViewTabs";
import type { DomainView } from "./ViewTabs";
import { CategoryMonthList } from "./CategoryMonthList";
import { CategoryDrilldown } from "./CategoryDrilldown";
import { PeriodTransactionsList } from "./PeriodTransactionsList";
import { RecurringChecklist } from "./RecurringChecklist";
import { RecurrentTransactionModal } from "./RecurrentTransactionModal";
import { QuickTransactionModal } from "../../transactions/components/QuickTransactionModal";
import { SubscriptionInsights } from "../../insights/components/SubscriptionInsights";
import { AccountValuePanels } from "../../investments/components/AccountValuePanels";
import { AccountValueList } from "../../investments/components/AccountValueList";
import { ValuationRows } from "../../investments/components/ValuationRows";
import { isAccountDomain } from "../../../helpers/accounts";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
import {
  expectedForMonth,
  monthTotals,
  monthTotalsByCurrency,
  monthWindows,
  trailingAverage,
} from "../helpers/months";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useCategories } from "../../../hooks/useCategories";
import { useRecurrentTransactions, markItemPaid } from "../../../hooks/useRecurrentTransactions";
import { usePaymentMethods } from "../../../hooks/usePaymentMethods";
import { useAccounts } from "../../../hooks/useAccounts";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { deleteTransaction } from "../../../hooks/useTransactions";
import { toDate } from "../../../helpers/chartData";
import {
  hiddenCategoryIds,
  hiddenItemIds,
  isHiddenRow,
  withoutHidden,
} from "../../../helpers/hidden";
import type { Category, Currency, Domain, RecurrentTransaction, Transaction } from "../../../types";

interface Props {
  domain: Domain;
}

const MONTHS = 7;

/** "Show hidden" is a per-domain preference, kept in the browser. */
const showHiddenKey = (domain: Domain) => `waletto:showHidden:${domain}`;
const readShowHidden = (domain: Domain) => {
  try {
    return typeof window !== "undefined" && localStorage.getItem(showHiddenKey(domain)) === "1";
  } catch {
    return false;
  }
};

/**
 * Month-first page shared by the four domains. One month is selected at a
 * time; the header, the bars and the panel below all speak about it. The
 * month in progress carries what the plan still owes before month end.
 */
export function DomainPage({ domain }: Props) {
  const config = DOMAIN_CONFIG[domain];
  const { ctx, target } = useMoneyContext();
  const currency: Currency = target;
  // Investments and savings sit in accounts / pockets, which carry value.
  const accountDomain = isAccountDomain(domain) ? domain : null;
  const { accounts } = useAccounts(accountDomain);

  // One clock per mount: the windows, "still planned" and the checklist all
  // agree on what "now" is, and the transactions query keeps one start date.
  const now = useMemo(() => new Date(), []);
  const windows = useMemo(() => monthWindows(MONTHS, now), [now]);
  const currentKey = windows[windows.length - 1].key;

  const [selectedKey, setSelectedKey] = useState(currentKey);
  const [view, setView] = useState<DomainView>("categories");
  const [drillCategoryId, setDrillCategoryId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurrentTransaction | undefined>(undefined);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

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
  const error = txError ?? itemsError ?? catError;

  const window = windows.find((w) => w.key === selectedKey) ?? windows[windows.length - 1];

  // Hidden recurring items and hidden categories stay out of the bars and
  // the month figure unless the owner flips "Show hidden"; the lists below
  // always show everything, tagged.
  const [showHidden, setShowHidden] = useState(() => readShowHidden(domain));
  useEffect(() => {
    try {
      localStorage.setItem(showHiddenKey(domain), showHidden ? "1" : "0");
    } catch {
      // Private mode or storage off: the toggle just doesn't stick.
    }
  }, [domain, showHidden]);
  const hiddenItems = useMemo(() => hiddenItemIds(items), [items]);
  const hiddenCategories = useMemo(() => hiddenCategoryIds(categories), [categories]);
  const anythingHidden = hiddenItems.size > 0 || hiddenCategories.size > 0;
  const isHidden = (t: Transaction) => isHiddenRow(t, hiddenItems, hiddenCategories);
  const chartTransactions = useMemo(
    () => (showHidden ? transactions : withoutHidden(transactions, hiddenItems, hiddenCategories)),
    [showHidden, transactions, hiddenItems, hiddenCategories]
  );
  const chartItems = useMemo(
    () =>
      showHidden
        ? items
        : items.filter((i) => !i.hiddenFromDashboard && !hiddenCategories.has(i.categoryId)),
    [showHidden, items, hiddenCategories]
  );

  const totals = useMemo(
    () => monthTotals(chartTransactions, ctx, windows),
    [chartTransactions, ctx, windows]
  );
  const monthTransactions = useMemo(
    () =>
      transactions.filter((t) => {
        const d = toDate(t.occurredAt);
        return d >= window.start && d < window.end;
      }),
    [transactions, window]
  );
  const realized = totals[window.key] ?? 0;
  const expected = useMemo(
    () => expectedForMonth(window, realized, chartItems, ctx, now),
    [window, realized, chartItems, ctx, now]
  );
  const average = useMemo(() => trailingAverage(totals, windows), [totals, windows]);
  const hasForeign = useMemo(
    () => monthTransactions.some((t) => t.currency !== currency),
    [monthTransactions, currency]
  );

  // One bar per month. With more than one currency in use the bar is stacked
  // by the currency each transaction was in, so the mix is visible at a glance.
  const byCurrency = useMemo(
    () => monthTotalsByCurrency(chartTransactions, ctx, windows),
    [chartTransactions, ctx, windows]
  );
  const multiCurrency = byCurrency.currencies.length > 1;
  const series: BarSeries[] = useMemo(
    () =>
      multiCurrency
        ? byCurrency.currencies.map((c) => ({ key: c, label: c, color: CURRENCY_COLORS[c] }))
        : [{ key: "amount", label: config.spentLabel, color: config.accent }],
    [multiCurrency, byCurrency.currencies, config.spentLabel, config.accent]
  );
  const bars: MonthBar[] = useMemo(
    () =>
      windows.map((w) => ({
        key: w.key,
        label: w.label,
        isCurrent: w.isCurrent,
        ...(multiCurrency
          ? Object.fromEntries(
              byCurrency.currencies.map((c) => [c, byCurrency.totals[w.key]?.[c] ?? 0])
            )
          : { amount: totals[w.key] ?? 0 }),
        ...(w.isCurrent && expected > realized ? { planned: expected - realized } : {}),
      })),
    [windows, totals, expected, realized, multiCurrency, byCurrency]
  );

  const selectMonth = (key: string) => {
    setSelectedKey(key);
    setDrillCategoryId(null);
  };

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
          monthLabel={window.label}
          loading={txLoading}
          onBack={() => setDrillCategoryId(null)}
          onEdit={setEditingTx}
          isHidden={isHidden}
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
          transactions={monthTransactions}
          items={items}
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
        <PeriodTransactionsList
          title={`${config.title} · ${window.label}`}
          transactions={monthTransactions}
          displayCurrency={currency}
          ctx={ctx}
          loading={txLoading}
          onEdit={setEditingTx}
          isHidden={isHidden}
          onDelete={deleteTx}
          deletingId={deletingTxId}
          now={now}
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
    <PageLayout title={config.title} domain={domain}>
      {error && <ErrorState error={error} />}

      <div className="layout">
        <div className="overview">
          <Card accentColor={config.accent}>
            <MonthHeader
              domain={domain}
              windows={windows}
              selectedKey={selectedKey}
              onSelect={selectMonth}
              realized={realized}
              expected={expected}
              average={average}
              currency={currency}
              approximate={hasForeign}
            />
            <MonthlyBarsChart
              data={bars}
              series={series}
              stacked={multiCurrency}
              currency={currency}
              loading={txLoading}
              average={average}
              selectedKey={selectedKey}
              onSelect={selectMonth}
              height={200}
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
        </div>

        <div className="detail">
          <ViewTabs
            value={view}
            onChange={(v) => {
              setView(v);
              setDrillCategoryId(null);
            }}
            accent={config.accent}
            showValue={Boolean(accountDomain)}
          />
          {panel}
        </div>
      </div>

      <RecurrentTransactionModal
        domain={domain}
        open={modalOpen}
        item={editingItem}
        onClose={() => setModalOpen(false)}
      />
      {editingTx && (
        <QuickTransactionModal
          open
          domain={domain}
          transaction={editingTx}
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

        .layout {
          display: grid;
          gap: 20px;
        }

        .overview,
        .detail {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }

        @media (min-width: 1100px) {
          .layout {
            grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
            align-items: start;
          }
        }
      `}</style>
    </PageLayout>
  );
}
