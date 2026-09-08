import { useMemo, useState } from "react";
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
import { InvestmentValuePanel } from "../../investments/components/InvestmentValuePanel";
import { InvestmentValueList } from "../../investments/components/InvestmentValueList";
import { ValuationRows } from "../../investments/components/ValuationRows";
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
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { deleteTransaction, updateTransaction } from "../../../hooks/useTransactions";
import { toDate } from "../../../helpers/chartData";
import type { Currency, Domain, RecurrentTransaction, Transaction } from "../../../types";

interface Props {
  domain: Domain;
}

const MONTHS = 7;

function NewItemButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="new-btn" onClick={onClick}>
      + {label}
      <style jsx>{`
        .new-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--r-md);
          border: none;
          background: var(--fg-0);
          color: var(--bg-0);
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
      `}</style>
    </button>
  );
}

/**
 * Month-first page shared by the four domains. One month is selected at a
 * time; the header, the bars and the panel below all speak about it. The
 * month in progress carries what the plan still owes before month end.
 */
export function DomainPage({ domain }: Props) {
  const config = DOMAIN_CONFIG[domain];
  const { ctx, target } = useMoneyContext();
  const currency: Currency = target;

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
  const { categories, loading: catLoading, error: catError } = useCategories(domain);
  const { methods } = usePaymentMethods();
  const error = txError ?? itemsError ?? catError;

  const window = windows.find((w) => w.key === selectedKey) ?? windows[windows.length - 1];
  const totals = useMemo(
    () => monthTotals(transactions, ctx, windows),
    [transactions, ctx, windows]
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
    () => expectedForMonth(window, realized, items, ctx, now),
    [window, realized, items, ctx, now]
  );
  const average = useMemo(() => trailingAverage(totals, windows), [totals, windows]);
  const hasForeign = useMemo(
    () => monthTransactions.some((t) => t.currency !== currency),
    [monthTransactions, currency]
  );

  // One bar per month. With more than one currency in use the bar is stacked
  // by the currency each transaction was in, so the mix is visible at a glance.
  const byCurrency = useMemo(
    () => monthTotalsByCurrency(transactions, ctx, windows),
    [transactions, ctx, windows]
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

  const openCreate = () => {
    setEditingItem(undefined);
    setModalOpen(true);
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
  const toggleTxHidden = (t: Transaction) =>
    t.id &&
    updateTransaction(t.id, { hiddenFromDashboard: !t.hiddenFromDashboard }).catch((err) =>
      console.error("Failed to update transaction:", err)
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
          onToggleHidden={toggleTxHidden}
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
              {domain === "INVESTMENT" && drillCategory.id && (
                <InvestmentValuePanel
                  key={drillCategory.id}
                  categoryId={drillCategory.id}
                  categoryName={drillCategory.name}
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
          onToggleHidden={toggleTxHidden}
          onDelete={deleteTx}
          deletingId={deletingTxId}
          now={now}
        />
        {domain === "INVESTMENT" && (
          <ValuationRows categories={categories} start={window.start} end={window.end} />
        )}
      </>
    ) : view === "value" ? (
      <InvestmentValueList
        categories={categories}
        ctx={ctx}
        currency={currency}
        onOpen={(categoryId) => {
          setView("categories");
          setDrillCategoryId(categoryId);
        }}
      />
    ) : (
      <RecurringChecklist
        domain={domain}
        items={items}
        transactions={monthTransactions}
        paymentMethods={methods}
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
      title={config.title}
      domain={domain}
      actions={
        <NewItemButton label={`New ${config.noun.replace(/s$/, "")}`} onClick={openCreate} />
      }
    >
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
            showValue={domain === "INVESTMENT"}
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
