import { allocationSegments } from "../../../helpers/allocation";
import type { AllocationKey } from "../../../helpers/allocation";
import type { MoneyFlow } from "../../../helpers/aggregations";

interface Props {
  flow: MoneyFlow;
}

const COLOR: Record<AllocationKey, string> = {
  expenses: "var(--domain-expense)",
  investments: "var(--domain-investment)",
  savings: "var(--domain-saving)",
  left: "var(--domain-income)",
};

const LABEL: Record<AllocationKey, string> = {
  expenses: "Expenses",
  investments: "Investments",
  savings: "Savings",
  left: "Left to allocate",
};

/** One bar for the month's income: what goes where, and the slice still free. */
export function AllocationBar({ flow }: Props) {
  const segments = allocationSegments(flow);
  return (
    <div
      className="bar"
      role="img"
      aria-label={segments.map((s) => `${LABEL[s.key]} ${Math.round(s.share * 100)}%`).join(", ")}
    >
      {segments.map((s) => (
        <span
          key={s.key}
          className="seg"
          style={{ width: `${s.share * 100}%`, background: COLOR[s.key] }}
          title={`${LABEL[s.key]} ${Math.round(s.share * 100)}%`}
        />
      ))}
      <style jsx>{`
        .bar {
          display: flex;
          gap: 3px;
          width: 100%;
          height: 10px;
          border-radius: 999px;
          background: var(--glass-inset);
          box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }

        .seg {
          height: 100%;
          border-radius: 999px;
          min-width: 3px;
          transition: width 0.3s ease;
        }
      `}</style>
    </div>
  );
}
