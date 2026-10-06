import { useMemo, useState } from "react";
import { PageLayout } from "../../../components/organisms/PageLayout";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { TabStrip } from "../../../components/atoms/TabStrip";
import { FlowChart } from "../../../components/molecules/FlowChart";
import { CancelableItemsList } from "./CancelableItemsList";
import { EmergencyView } from "./EmergencyView";
import { ProspectModeToggle } from "./ProspectModeToggle";
import type { ProspectMode } from "./ProspectModeToggle";
import { WhatIfSummary } from "./WhatIfSummary";
import { useWhatIf } from "../hooks/useWhatIf";
import { computeWhatIfImpact } from "../helpers/whatIfImpact";
import { buildWhatIfProjection } from "../helpers/whatIfProjection";
import { rankCancelable } from "../helpers/rankCancelable";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { useCategories } from "../../../hooks/useCategories";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { computeFlow } from "../../../helpers";
import { errorMessage } from "../../../utils/errorMessage";
import type { Currency, RecurrentTransaction } from "../../../types";

const HORIZONS = [
  { key: "6", label: "6 months", months: 6 },
  { key: "12", label: "12 months", months: 12 },
];

/** The dashboard's rule: an item hidden from it is out of every plan number. */
const visible = (items: RecurrentTransaction[]) => items.filter((i) => !i.hiddenFromDashboard);

interface Props {
  /** Stories open straight into emergency mode; the route always starts in what-if. */
  initialMode?: ProspectMode;
}

/**
 * The plan simulator. What-if mode ranks what could go — non-essential
 * spending first — and shows how cancelling it moves the monthly net.
 * Emergency mode answers the harder question: if the income stopped, how many
 * months would savings carry the essentials?
 */
export function ProspectPage({ initialMode = "whatif" }: Props) {
  const { ctx, target, fxMissing } = useMoneyContext();
  const currency: Currency = target;

  const incomeQ = useRecurrentTransactions("INCOME");
  const expenseQ = useRecurrentTransactions("EXPENSE");
  const investmentQ = useRecurrentTransactions("INVESTMENT");
  const savingQ = useRecurrentTransactions("SAVING");
  const debtQ = useRecurrentTransactions("DEBT");
  const { categories } = useCategories();
  const queries = [incomeQ, expenseQ, investmentQ, savingQ, debtQ];
  const loading = queries.some((q) => q.loading);
  const error = queries.find((q) => q.error)?.error ?? null;

  const incomes = useMemo(() => visible(incomeQ.items), [incomeQ.items]);
  const expenses = useMemo(() => visible(expenseQ.items), [expenseQ.items]);
  const investments = useMemo(() => visible(investmentQ.items), [investmentQ.items]);
  const savings = useMemo(() => visible(savingQ.items), [savingQ.items]);
  const debts = useMemo(() => visible(debtQ.items), [debtQ.items]);

  const [mode, setMode] = useState<ProspectMode>(initialMode);
  const { excludedIds, toggle, setMany } = useWhatIf();
  const [horizon, setHorizon] = useState(HORIZONS[0].key);
  const [saveError, setSaveError] = useState<string | null>(null);

  const cancelable = useMemo(
    () => [...expenses, ...investments, ...savings, ...debts],
    [expenses, investments, savings, debts]
  );
  const groups = useMemo(
    () => rankCancelable(cancelable, categories, ctx),
    [cancelable, categories, ctx]
  );

  const currentFlow = useMemo(
    () =>
      computeFlow(
        {
          INCOME: incomes,
          EXPENSE: expenses,
          INVESTMENT: investments,
          SAVING: savings,
          DEBT: debts,
        },
        ctx
      ),
    [incomes, expenses, investments, savings, debts, ctx]
  );

  const impact = useMemo(
    () => computeWhatIfImpact(cancelable, excludedIds, ctx),
    [cancelable, excludedIds, ctx]
  );

  const months = HORIZONS.find((h) => h.key === horizon)?.months ?? HORIZONS[0].months;
  const projection = useMemo(
    () => buildWhatIfProjection(currentFlow.net, impact.freedMonthly, months),
    [currentFlow.net, impact.freedMonthly, months]
  );

  // "≈" only means something when a conversion actually happened.
  const hasForeign = [incomes, cancelable].some((list) => list.some((i) => i.currency !== target));
  const approximate = hasForeign && !fxMissing;

  const markEssential = async (item: RecurrentTransaction, essential: boolean) => {
    if (!item.id) return;
    setSaveError(null);
    try {
      await expenseQ.update(item.id, { essential });
    } catch (err) {
      setSaveError(errorMessage(err, `Couldn't update ${item.name}.`));
    }
  };

  const list = (
    <CancelableItemsList
      groups={groups}
      mode={mode}
      excludedIds={excludedIds}
      onToggle={toggle}
      onSelect={setMany}
      onMarkEssential={markEssential}
      categories={categories}
      currency={currency}
      loading={loading}
    />
  );

  return (
    <PageLayout
      title="Prospect"
      subtitle={
        mode === "emergency"
          ? "If your income stopped today, how long would you last?"
          : "What could you cut, and what would it change?"
      }
      hideMonth
    >
      <div className="modebar">
        <ProspectModeToggle mode={mode} onChange={setMode} />
      </div>

      {error && <ErrorState error={error} />}
      {hasForeign && fxMissing && (
        <ErrorState
          title="Exchange rates unavailable"
          description="Totals mix currencies without conversion right now. They'll correct themselves when rates load again."
        />
      )}
      {saveError && <ErrorState title="Couldn't save" description={saveError} />}

      {mode === "emergency" ? (
        <EmergencyView
          groups={groups}
          categories={categories}
          ctx={ctx}
          currency={currency}
          loading={loading}
          approximate={approximate}
          list={list}
        />
      ) : (
        <>
          <WhatIfSummary
            impact={impact}
            currentNet={currentFlow.net}
            currency={currency}
            approximate={approximate}
          />

          <Card>
            <div className="chart-head">
              <SectionTitle title="Projected net" />
              <TabStrip
                tabs={HORIZONS}
                value={horizon}
                onChange={setHorizon}
                label="Projection horizon"
              />
            </div>
            <FlowChart
              data={projection}
              currency={currency}
              loading={loading}
              labelA="As planned"
              labelB="If cancelled"
              colorA="var(--fg-2)"
              colorB="var(--positive)"
            />
          </Card>

          {list}
        </>
      )}

      <style jsx>{`
        .modebar {
          display: flex;
          justify-content: flex-end;
        }

        .chart-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        @media (max-width: 767px) {
          .modebar {
            justify-content: stretch;
          }

          .modebar > :global(*) {
            flex: 1;
            justify-content: space-between;
          }
        }
      `}</style>
    </PageLayout>
  );
}
