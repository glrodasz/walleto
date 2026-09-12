import type { ReactNode } from "react";
import { formatAmount } from "../atoms/Amount";
import { IconDisc } from "./IconDisc";
import { ListItem, ListItems } from "./ListItem";
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
  if (loading || groups.length === 0) {
    return (
      <p className="empty">
        {loading ? "Loading…" : emptyLabel}
        <style jsx>{`
          .empty {
            margin: 0;
            padding: 8px 0;
            font-size: 0.85rem;
            color: var(--fg-2);
          }
        `}</style>
      </p>
    );
  }
  return (
    <ListItems>
      {groups.map((g) => (
        <ListItem
          key={g.key}
          leading={
            icon ? (
              <IconDisc color={color} size={36}>
                {icon(g)}
              </IconDisc>
            ) : undefined
          }
          name={g.label}
          meta={`${g.count} transaction${g.count === 1 ? "" : "s"} · ${Math.round(g.share * 100)}%`}
          progress={{ ratio: g.share, color, label: `${g.label} share` }}
          amount={formatAmount(g.total, currency)}
          onClick={onSelect ? () => onSelect(g.key) : undefined}
        />
      ))}
    </ListItems>
  );
}
