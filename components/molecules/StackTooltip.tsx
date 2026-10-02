import { useMoneyFormat } from "../../hooks/useMoneyFormat";
import { flatKey } from "../../features/dashboard/helpers/cashFlowSeries";
import type { CashFlowGroup, GroupedBar } from "../../features/dashboard/helpers/cashFlowSeries";
import type { Currency } from "../../types";

interface Props {
  /** What recharts hands a custom tooltip: with `shared={false}`, the one hovered segment. */
  active?: boolean;
  payload?: ReadonlyArray<{ dataKey?: unknown; payload?: unknown }>;
  groups: CashFlowGroup[];
  currency: Currency;
}

/**
 * The tooltip for one hovered bar of a grouped stacked chart: that group's
 * series for that month, largest first, and their total. Listing every group
 * at once (recharts' shared tooltip) is unreadable once each bar is a stack
 * of categories or currencies.
 */
export function StackTooltip({ active, payload, groups, currency }: Props) {
  const { formatAmount } = useMoneyFormat();
  const item = active ? payload?.[0] : undefined;
  const groupKey = String(item?.dataKey ?? "").split(":")[0];
  const group = groups.find((g) => g.key === groupKey);
  const month = item?.payload as GroupedBar | undefined;
  if (!group || !month) return null;

  const rows = group.series
    .map((s) => ({ ...s, value: Number(month[flatKey(group.key, s.key)] ?? 0) }))
    .filter((s) => s.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const total = rows.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="glass glass--strong glass--raised stack-tip">
      <p className="head">
        <span className="dot" style={{ background: group.color }} />
        <span className="group">{group.label}</span>
        <span className="month">{month.label}</span>
      </p>
      <ul className="rows">
        {rows.map((s) => (
          <li key={s.key} className="row">
            <span className="dot" style={{ background: s.color }} />
            <span className="name">{s.label}</span>
            <span className="value">{formatAmount(s.value, currency)}</span>
          </li>
        ))}
      </ul>
      {rows.length > 1 && (
        <p className="row total">
          <span className="name">Total</span>
          <span className="value">{formatAmount(total, currency)}</span>
        </p>
      )}

      <style jsx>{`
        .stack-tip {
          min-width: 200px;
          max-width: 280px;
          padding: 10px 14px;
          border-radius: var(--r-md);
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.8rem;
        }

        .head {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .group {
          font-weight: 600;
          color: var(--fg-0);
        }

        .month {
          margin-left: auto;
          font-size: 0.75rem;
          color: var(--fg-2);
        }

        .rows {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .row {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .name {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--fg-1);
        }

        .value {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          color: var(--fg-0);
          white-space: nowrap;
        }

        .total {
          padding-top: 6px;
          border-top: 1px solid var(--line);
        }

        .total .name,
        .total .value {
          font-weight: 700;
          color: var(--fg-0);
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
