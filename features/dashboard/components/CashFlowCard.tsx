import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { Select } from "../../../components/atoms/Select";
import { GroupedStackedBarsChart } from "../../../components/molecules/GroupedStackedBarsChart";
import type { CashFlowGroup, CashFlowGroupBy, GroupedBar } from "../helpers/cashFlowSeries";
import type { Currency } from "../../../types";

export const CASH_FLOW_PERIODS = [3, 6, 12] as const;
export type CashFlowPeriod = (typeof CASH_FLOW_PERIODS)[number];

const GROUP_BY_OPTIONS: { value: CashFlowGroupBy; label: string }[] = [
  { value: "domain", label: "Group by domain" },
  { value: "category", label: "Group by category" },
  { value: "currency", label: "Group by currency" },
];

interface Props {
  data: GroupedBar[];
  groups: CashFlowGroup[];
  currency: Currency;
  loading: boolean;
  period: CashFlowPeriod;
  onPeriod: (period: CashFlowPeriod) => void;
  groupBy: CashFlowGroupBy;
  onGroupBy: (groupBy: CashFlowGroupBy) => void;
  selectedKey?: string;
  onSelect?: (key: string) => void;
}

/** "Monthly cash flow": four domains per month, each stacked, with its controls and legend. */
export function CashFlowCard({
  data,
  groups,
  currency,
  loading,
  period,
  onPeriod,
  groupBy,
  onGroupBy,
  selectedKey,
  onSelect,
}: Props) {
  return (
    <Card>
      <SectionTitle title="Monthly cash flow" subtitle="Actual transactions, split by category.">
        <div className="control">
          <Select
            aria-label="Period"
            options={CASH_FLOW_PERIODS.map((p) => ({
              value: String(p),
              label: `Last ${p} months`,
            }))}
            value={String(period)}
            onValueChange={(v) => onPeriod(Number(v) as CashFlowPeriod)}
          />
        </div>
        <div className="control">
          <Select
            aria-label="Group by"
            options={GROUP_BY_OPTIONS}
            value={groupBy}
            onValueChange={(v) => onGroupBy(v as CashFlowGroupBy)}
          />
        </div>
      </SectionTitle>

      <GroupedStackedBarsChart
        data={data}
        groups={groups}
        currency={currency}
        loading={loading}
        selectedKey={selectedKey}
        onSelect={onSelect}
      />

      <ul className="legend" aria-label="Legend">
        {groups.map((g) => (
          <li key={g.key} className="group">
            <details>
              <summary>
                <span className="dot" style={{ background: g.color }} />
                <span className="label">{g.label}</span>
                {groupBy !== "domain" && (
                  <span className="count">
                    {g.series.length} {groupBy === "category" ? "categor" : "currenc"}
                    {g.series.length === 1 ? "y" : "ies"}
                  </span>
                )}
              </summary>
              {groupBy !== "domain" && (
                <ul className="series">
                  {g.series.map((s) => (
                    <li key={s.key}>
                      <span className="dot" style={{ background: s.color }} />
                      {s.label}
                    </li>
                  ))}
                </ul>
              )}
            </details>
          </li>
        ))}
      </ul>

      <style jsx>{`
        .control {
          min-width: 150px;
        }

        .legend {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 8px;
        }

        .group details {
          border: 1px solid var(--line);
          border-radius: var(--r-md);
          background: var(--bg-1);
          padding: 8px 12px;
        }

        .group summary {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          list-style: none;
          font-size: 0.8rem;
        }

        .group summary::-webkit-details-marker {
          display: none;
        }

        .label {
          font-weight: 600;
          color: var(--fg-0);
        }

        .count {
          color: var(--fg-2);
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .series {
          list-style: none;
          margin: 8px 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.75rem;
          color: var(--fg-1);
        }

        .series li {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 767px) {
          .control {
            min-width: 0;
            flex: 1;
          }
        }
      `}</style>
    </Card>
  );
}
