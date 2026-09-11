import { useMemo, useState } from "react";
import { withOnboardingGuard } from "../features/onboarding/helpers/onboardingGuard";
import { PageLayout } from "../components/organisms/PageLayout";
import { Card } from "../components/atoms/Card";
import { SectionTitle } from "../components/atoms/SectionTitle";
import { ErrorState } from "../components/atoms/ErrorState";
import { FlowChart } from "../components/molecules/FlowChart";
import { CancelableItemsList } from "../features/prospect/components/CancelableItemsList";
import { WhatIfSummary } from "../features/prospect/components/WhatIfSummary";
import { useWhatIf } from "../features/prospect/hooks/useWhatIf";
import { computeWhatIfImpact } from "../features/prospect/helpers/whatIfImpact";
import { buildWhatIfProjection } from "../features/prospect/helpers/whatIfProjection";
import { useRecurrentTransactions } from "../hooks/useRecurrentTransactions";
import { useMoneyContext } from "../hooks/useMoneyContext";
import { computeFlow } from "../helpers";
import type { Currency } from "../types";

export const getServerSideProps = withOnboardingGuard();

const HORIZONS = [
  { label: "6 months", months: 6 },
  { label: "12 months", months: 12 },
];

export default function ProspectPage() {
  const { ctx, target } = useMoneyContext();
  const currency: Currency = target;

  const { items: incomes, loading: l1, error: e1 } = useRecurrentTransactions("INCOME");
  const { items: expenses, loading: l2, error: e2 } = useRecurrentTransactions("EXPENSE");
  const { items: investments, loading: l3, error: e3 } = useRecurrentTransactions("INVESTMENT");
  const { items: savings, loading: l4, error: e4 } = useRecurrentTransactions("SAVING");
  const loading = l1 || l2 || l3 || l4;
  const error = e1 ?? e2 ?? e3 ?? e4;

  const { excludedIds, toggle } = useWhatIf();
  const [horizonIdx, setHorizonIdx] = useState(0);

  // Income can't be "cancelled" here — only spending, savings transfers and
  // investment contributions are candidates, matching the net formula's terms.
  const cancelable = useMemo(
    () => [...expenses, ...investments, ...savings],
    [expenses, investments, savings]
  );

  const currentFlow = useMemo(
    () =>
      computeFlow(
        { INCOME: incomes, EXPENSE: expenses, INVESTMENT: investments, SAVING: savings },
        ctx
      ),
    [incomes, expenses, investments, savings, ctx]
  );

  const impact = useMemo(
    () => computeWhatIfImpact(cancelable, excludedIds, ctx),
    [cancelable, excludedIds, ctx]
  );

  const projection = useMemo(
    () => buildWhatIfProjection(currentFlow.net, impact.freedMonthly, HORIZONS[horizonIdx].months),
    [currentFlow.net, impact.freedMonthly, horizonIdx]
  );

  return (
    <PageLayout title="Prospect" hideMonth>
      {error && <ErrorState error={error} />}

      <section className="row">
        <CancelableItemsList
          items={cancelable}
          excludedIds={excludedIds}
          onToggle={toggle}
          ctx={ctx}
          currency={currency}
          loading={loading}
        />

        <div className="right-col">
          <WhatIfSummary impact={impact} currentNet={currentFlow.net} currency={currency} />

          <Card>
            <div className="chart-head">
              <SectionTitle title="Projected net" />
              <div className="horizon-tabs">
                {HORIZONS.map((h, i) => (
                  <button
                    key={h.label}
                    type="button"
                    className={`horizon-btn${i === horizonIdx ? " active" : ""}`}
                    onClick={() => setHorizonIdx(i)}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
            <FlowChart
              data={projection}
              currency={currency}
              loading={loading}
              labelA="Current"
              labelB="If cancelled"
              colorA="var(--fg-2)"
              colorB="var(--accent)"
            />
          </Card>
        </div>
      </section>

      <style jsx>{`
        .row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .row > :global(*) {
          flex: 1;
          min-width: 0;
        }

        .right-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chart-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .horizon-tabs {
          display: flex;
          gap: 2px;
          background: var(--bg-2);
          border-radius: var(--r-sm);
          padding: 3px;
        }

        .horizon-btn {
          padding: 5px 12px;
          border-radius: calc(var(--r-sm) - 2px);
          border: none;
          background: transparent;
          color: var(--fg-2);
          font-size: 0.8rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
        }

        .horizon-btn.active {
          background: var(--bg-3);
          color: var(--fg-0);
        }

        @media (max-width: 900px) {
          .row {
            flex-direction: column;
          }
        }
      `}</style>
    </PageLayout>
  );
}
