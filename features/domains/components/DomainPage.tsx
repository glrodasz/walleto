import { useMemo, useState } from "react";
import { PageLayout } from "../../../components/organisms/PageLayout";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { DomainSummary } from "./DomainSummary";
import { DomainChart } from "./DomainChart";
import { DomainCategoryTable } from "./DomainCategoryTable";
import { PeriodTransactionsList } from "./PeriodTransactionsList";
import { RecurrentTransactionModal } from "./RecurrentTransactionModal";
import { SubscriptionInsights } from "../../insights/components/SubscriptionInsights";
import { InvestmentValuePanel } from "../../investments/components/InvestmentValuePanel";
import { PERIODS, DEFAULT_PERIOD_INDEX, getStartDate } from "../helpers/periods";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
import { toDomainChartData } from "../helpers/domainChartData";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useCategories } from "../../../hooks/useCategories";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { usePaymentMethods } from "../../../hooks/usePaymentMethods";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { deleteTransaction } from "../../../hooks/useTransactions";
import { startOfPreviousMonth } from "../../../utils/startOfPreviousMonth";
import { sumMonthly, computeMoM, convertedAmount } from "../../../helpers";
import type { Currency, Domain, RecurrentTransaction } from "../../../types";

interface Props {
  domain: Domain;
}

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
 * The p2/p3 mockup page, parameterized per domain: KPI header with delta and
 * run-rate, period control, area chart, category tabs and the items table.
 */
export function DomainPage({ domain }: Props) {
  const config = DOMAIN_CONFIG[domain];
  const { ctx, target } = useMoneyContext();
  const currency: Currency = target;

  const [periodIdx, setPeriodIdx] = useState(DEFAULT_PERIOD_INDEX);
  const startDate = useMemo(() => getStartDate(PERIODS[periodIdx].months), [periodIdx]);
  // Fetch at least back to the 1st of last month so the MoM badge always
  // compares against a complete previous month, whatever period is displayed.
  const fetchStart = useMemo(() => {
    const momStart = startOfPreviousMonth();
    return startDate < momStart ? startDate : momStart;
  }, [startDate]);

  const {
    transactions: fetched,
    loading: txLoading,
    error: txError,
  } = useDomainTransactions(domain, fetchStart);
  const { items: recurringItems, error: itemsError, remove } = useRecurrentTransactions(domain);
  const { categories, loading: catLoading, error: catError } = useCategories(domain);
  const { methods } = usePaymentMethods();
  const error = txError ?? itemsError ?? catError;

  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const selectedCatId = activeCatId ?? categories[0]?.id ?? null;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurrentTransaction | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

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

  const openCreate = () => {
    setEditingItem(undefined);
    setModalOpen(true);
  };
  const openEdit = (recurringItem: RecurrentTransaction) => {
    setEditingItem(recurringItem);
    setModalOpen(true);
  };
  const deleteItem = async (recurringItemId: string) => {
    setDeletingId(recurringItemId);
    try {
      await remove(recurringItemId);
    } catch (err) {
      console.error("Failed to delete recurrent item:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const transactions = useMemo(
    () => fetched.filter((t) => t.occurredAt.toDate() >= startDate),
    [fetched, startDate]
  );
  const chartData = useMemo(() => toDomainChartData(transactions, ctx), [transactions, ctx]);
  const periodTotal = useMemo(
    () => transactions.reduce((sum, t) => sum + convertedAmount(t, ctx), 0),
    [transactions, ctx]
  );
  const momDelta = useMemo(() => computeMoM(fetched, { ...ctx, domain }), [fetched, ctx, domain]);
  const runRate = useMemo(() => sumMonthly(recurringItems, ctx), [recurringItems, ctx]);
  const hasForeign = useMemo(
    () => transactions.some((t) => t.currency !== currency),
    [transactions, currency]
  );

  const filteredItems = useMemo(
    () => recurringItems.filter((i) => i.categoryId === selectedCatId),
    [recurringItems, selectedCatId]
  );
  const catTotal = useMemo(() => sumMonthly(filteredItems, ctx), [filteredItems, ctx]);
  const categoryTransactions = useMemo(
    () => transactions.filter((t) => t.categoryId === selectedCatId),
    [transactions, selectedCatId]
  );

  const selectedCategoryName = categories.find((c) => c.id === selectedCatId)?.name;
  const showSubscriptionInsights =
    domain === "EXPENSE" && selectedCategoryName?.trim().toLowerCase() === "subscriptions";

  return (
    <PageLayout
      title={config.title}
      domain={domain}
      actions={
        <NewItemButton label={`New ${config.noun.replace(/s$/, "")}`} onClick={openCreate} />
      }
    >
      {error && <ErrorState error={error} />}

      <DomainSummary
        domain={domain}
        periodTotal={periodTotal}
        runRate={runRate}
        currency={currency}
        deltaPct={momDelta.deltaPct}
        approximate={hasForeign}
        periodIdx={periodIdx}
        onPeriodChange={setPeriodIdx}
      />

      <DomainChart domain={domain} data={chartData} currency={currency} loading={txLoading} />

      <DomainCategoryTable
        domain={domain}
        categories={categories}
        items={filteredItems}
        paymentMethods={methods}
        selectedCategoryId={selectedCatId}
        categoryTotal={catTotal}
        currency={currency}
        loading={catLoading}
        onSelectCategory={setActiveCatId}
        onEdit={openEdit}
        onDelete={deleteItem}
        deletingId={deletingId}
      />

      <PeriodTransactionsList
        title={`${selectedCategoryName ?? config.title} · ${PERIODS[periodIdx].label}`}
        transactions={categoryTransactions}
        displayCurrency={currency}
        loading={txLoading}
        onDelete={deleteTx}
        deletingId={deletingTxId}
      />

      {showSubscriptionInsights && (
        <SubscriptionInsights
          items={recurringItems}
          categories={categories}
          ctx={ctx}
          currency={currency}
        />
      )}

      {domain === "INVESTMENT" && selectedCatId && selectedCategoryName && (
        <InvestmentValuePanel
          key={selectedCatId}
          categoryId={selectedCatId}
          categoryName={selectedCategoryName}
          ctx={ctx}
          currency={currency}
        />
      )}

      <RecurrentTransactionModal
        domain={domain}
        open={modalOpen}
        item={editingItem}
        onClose={() => setModalOpen(false)}
      />
    </PageLayout>
  );
}
