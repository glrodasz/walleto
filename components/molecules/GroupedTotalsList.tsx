import type { ReactNode } from "react";
import { useMoneyFormat } from "../../hooks/useMoneyFormat";
import { IconDisc } from "./IconDisc";
import { ListItem, ListItems } from "./ListItem";
import type { Currency } from "../../types";

export interface GroupedTotal {
  key: string;
  label: string;
  /**
   * What tells two same-named groups apart, drawn muted next to the label:
   * a payment method's type ("SEB · Bank transfer" vs "SEB · Debit card").
   */
  detail?: string;
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
  const { formatAmount } = useMoneyFormat();

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
          name={
            g.detail ? (
              <>
                {g.label}
                <span className="detail">{g.detail}</span>
              </>
            ) : (
              g.label
            )
          }
          meta={`${g.count} transaction${g.count === 1 ? "" : "s"} · ${Math.round(g.share * 100)}%`}
          progress={{
            ratio: g.share,
            color,
            label: `${g.detail ? `${g.label} (${g.detail})` : g.label} share`,
          }}
          amount={formatAmount(g.total, currency)}
          onClick={onSelect ? () => onSelect(g.key) : undefined}
        />
      ))}
      <style jsx>{`
        .detail {
          margin-left: 8px;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--fg-2);
        }
      `}</style>
    </ListItems>
  );
}
