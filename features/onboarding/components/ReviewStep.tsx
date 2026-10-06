import { ErrorState } from "../../../components/atoms/ErrorState";
import { NetFlowCard } from "../../../components/organisms/NetFlowCard";
import type { useReviewStep } from "../hooks/useReviewStep";
import { PlanPreviewList } from "./PlanPreviewList";

interface Props {
  state: ReturnType<typeof useReviewStep>;
  /** Back to the step that edits a group (saving the way there, as any step does). */
  onEdit: (href: string) => void;
}

/**
 * The last step: the plan as the dashboard will show it — the "Monthly plan"
 * hero with its verdict, and every item that makes it up — before Finish.
 */
export function ReviewStep({ state, onEdit }: Props) {
  const { loading, error, flow, ctx, currency, approximate, groups } = state;

  if (error) return <ErrorState title="Couldn't load your plan" error={error} />;
  if (loading) return <p className="loading">Loading your plan…</p>;

  return (
    <div className="review">
      <NetFlowCard
        flow={flow}
        currency={currency}
        approximate={approximate}
        stats={["income", "expenses"]}
      />

      {groups.map((group) => (
        <PlanPreviewList
          key={group.domain}
          group={group}
          monthly={group.domain === "INCOME" ? flow.income : flow.expenses}
          ctx={ctx}
          onEdit={onEdit}
        />
      ))}

      <style jsx>{`
        .review {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .loading {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--fg-2);
        }
      `}</style>
    </div>
  );
}
