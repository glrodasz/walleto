import type { ReactNode } from "react";
import { formatAmount } from "../atoms/Amount";
import { ProgressBar } from "./ProgressBar";
import { IconDisc } from "./IconDisc";
import type { Currency } from "../../types";

export interface GroupedTotal {
  key: string;
  label: string;
  /** Converted into the reporting currency. */
  total: number;
  count: number;
  /** 0–1 share of the whole. */
  share: number;
}

interface Props {
  groups: GroupedTotal[];
  currency: Currency;
  /** The bar and disc colour. */
  color: string;
  loading?: boolean;
  emptyLabel: string;
  /** Icon for a row, by group key. */
  icon?: (group: GroupedTotal) => ReactNode;
  onSelect?: (key: string) => void;
}

/** Rows of "label · N transactions · total · share bar": tags, methods, anything grouped. */
export function GroupedTotalsList({
  groups,
  currency,
  color,
  loading,
  emptyLabel,
  icon,
  onSelect,
}: Props) {
  if (loading) return <p className="empty">Loading…</p>;
  if (groups.length === 0) return <p className="empty">{emptyLabel}</p>;
  return (
    <ul className="list">
      {groups.map((g) => (
        <GroupedTotalRow
          key={g.key}
          group={g}
          currency={currency}
          color={color}
          icon={icon?.(g)}
          onSelect={onSelect}
        />
      ))}
      <style jsx>{`
        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </ul>
  );
}

interface RowProps {
  group: GroupedTotal;
  currency: Currency;
  color: string;
  icon?: ReactNode;
  onSelect?: (key: string) => void;
}

function GroupedTotalRow({ group, currency, color, icon, onSelect }: RowProps) {
  const body = (
    <>
      {icon && (
        <IconDisc color={color} size={36}>
          {icon}
        </IconDisc>
      )}
      <span className="main">
        <span className="head">
          <span className="label">{group.label}</span>
          <span className="total">{formatAmount(group.total, currency)}</span>
        </span>
        <span className="bar">
          <ProgressBar
            ratio={group.share}
            color={color}
            height={6}
            label={`${group.label} share`}
          />
          <span className="share">{Math.round(group.share * 100)}%</span>
        </span>
        <span className="meta">
          {group.count} transaction{group.count === 1 ? "" : "s"}
        </span>
      </span>
    </>
  );
  return (
    <li className="row">
      {onSelect ? (
        <button type="button" className="hit" onClick={() => onSelect(group.key)}>
          {body}
        </button>
      ) : (
        <div className="hit">{body}</div>
      )}
      <style jsx>{`
        .row {
          border-bottom: 1px solid var(--line);
        }

        .row:last-child {
          border-bottom: none;
        }

        .hit {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border: none;
          background: transparent;
          font-family: inherit;
          text-align: left;
          color: inherit;
        }

        button.hit {
          cursor: pointer;
        }

        .main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: baseline;
        }

        .label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--fg-0);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .total {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.85rem;
          color: var(--fg-0);
          white-space: nowrap;
        }

        .bar {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .share {
          flex-shrink: 0;
          width: 36px;
          text-align: right;
          font-size: 0.75rem;
          color: var(--fg-2);
        }

        .meta {
          font-size: 0.75rem;
          color: var(--fg-2);
        }
      `}</style>
    </li>
  );
}
