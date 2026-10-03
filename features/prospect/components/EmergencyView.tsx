import { useMemo } from "react";
import type { ReactNode } from "react";
import { Card } from "../../../components/atoms/Card";
import { ErrorState } from "../../../components/atoms/ErrorState";
import Skeleton from "../../../components/Skeleton";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { FlowChart } from "../../../components/molecules/FlowChart";
import { useDomainValue } from "../../investments/hooks/useDomainValue";
import { useEmergencyPlan } from "../hooks/useEmergencyPlan";
import {
  chartHorizon,
  emergencyBudget,
  emergencyProjection,
  planInTarget,
  runwayMonths,
} from "../helpers/emergency";
import type { CancelableGroups } from "../helpers/rankCancelable";
import { errorMessage } from "../../../utils/errorMessage";
import type { MoneyContext } from "../../../helpers/aggregations";
import type { Category, Currency } from "../../../types";
import { EmergencyPanel } from "./EmergencyPanel";
import { RunwayCard } from "./RunwayCard";

interface Props {
  groups: CancelableGroups;
  categories: Pick<Category, "id" | "domain">[];
  ctx: MoneyContext;
  currency: Currency;
  /** The plan is still loading. */
  loading: boolean;
  approximate: boolean;
  /** The cancel list, read-only here; rendered in the left column. */
  list: ReactNode;
}

/**
 * Emergency mode: the regular income stops, non-essentials and contributions
 * stop, and the cushion — savings, optionally investments, plus severance —
 * pays the essentials and debt until it runs out.
 *
 * Its own component so the inception-to-date value listeners only open while
 * the mode is on.
 */
export function EmergencyView({
  groups,
  categories,
  ctx,
  currency,
  loading,
  approximate,
  list,
}: Props) {
  const savings = useDomainValue("SAVING", categories, ctx);
  const investments = useDomainValue("INVESTMENT", categories, ctx);
  const { plan, save, error, loading: planLoading } = useEmergencyPlan();

  const budget = useMemo(() => emergencyBudget(groups), [groups]);
  const income = useMemo(() => planInTarget(plan, ctx), [plan, ctx]);
  const cushion = savings.value + (plan.includeInvestments ? investments.value : 0);

  const emergency = { cushion, burnMonthly: budget.burnMonthly, ...income };
  const keepEverything = { ...emergency, burnMonthly: budget.fullMonthly };
  const runway = runwayMonths(emergency);

  const projection = useMemo(
    () => emergencyProjection(keepEverything, emergency, chartHorizon(runway)),
    // The inputs are plain numbers; list them rather than two fresh objects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cushion, budget, income, runway]
  );

  // Until the saved plan arrives, `plan` is the zero fallback: neither the
  // runway nor the panel may treat it as the owner's.
  const busy = loading || planLoading || savings.loading || investments.loading;
  // A failed read must never pass for an empty cushion.
  const valueError = savings.error ?? (plan.includeInvestments ? investments.error : null);

  return (
    <div className="view">
      {valueError ? (
        <ErrorState
          title="Couldn't read your savings"
          description="The runway needs today's balances, so it isn't shown rather than counted from zero."
          error={valueError}
        />
      ) : (
        <>
          <RunwayCard
            runway={runway}
            budget={budget}
            savings={savings.value}
            investments={investments.value}
            includeInvestments={plan.includeInvestments}
            benefitMonthly={income.benefitMonthly}
            benefitMonths={income.benefitMonths}
            severance={income.severance}
            currency={currency}
            loading={busy}
            approximate={approximate}
          />

          <Card>
            <SectionTitle title="Cushion over time" />
            <FlowChart
              data={projection}
              currency={currency}
              loading={busy}
              labelA="Keeping everything"
              labelB="Emergency mode"
              colorA="var(--fg-2)"
              colorB="var(--accent-hot)"
            />
          </Card>
        </>
      )}

      <section className="row">
        {list}

        <div className="panel">
          {/* Mounted only once the saved plan is known: its fields seed from
              it, and an edit on the fallback would overwrite the real one. */}
          {planLoading ? (
            <Card>
              <SectionTitle title="Emergency income" />
              <Skeleton.Box width="100%" height={120} />
            </Card>
          ) : (
            <EmergencyPanel
              plan={plan}
              onSave={save}
              investments={investments.value}
              currency={currency}
              error={error ? errorMessage(error, "Couldn't save your emergency income.") : null}
            />
          )}
        </div>
      </section>

      <style jsx>{`
        .view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .row > :global(*) {
          flex: 1;
          min-width: 0;
        }

        @media (max-width: 900px) {
          .row {
            flex-direction: column;
          }

          /* The inputs drive the runway above; don't bury them under the list. */
          .panel {
            order: -1;
          }
        }
      `}</style>
    </div>
  );
}
