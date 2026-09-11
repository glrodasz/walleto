import Link from "next/link";
import type { ComponentType } from "react";
import type { Currency, Domain } from "../../types";
import { Card } from "../atoms/Card";
import { Amount } from "../atoms/Amount";
import { ArrowDown, ArrowUpRight, ChevronRight, Circle, TrendingUp } from "../atoms/Icons";
import type { IconProps } from "../atoms/Icons";
import { IconDisc } from "./IconDisc";
import { KebabMenu } from "./KebabMenu";
import type { KebabAction } from "./KebabMenu";

export interface StatRow {
  name: string;
  /** Already formatted: an amount or a percentage. */
  value: string;
}

interface Props {
  title: string;
  amount: number;
  currency: Currency;
  domain: Domain;
  /** The domain page; the whole header links there. */
  href: string;
  /** Up to two lines under the figure ("Salary · $57,000"). */
  rows?: StatRow[];
  categoryCount?: number;
  /** Share per currency in use; shown only when more than one is in play. */
  byCurrency?: { currency: Currency; pct: number }[];
  actions?: KebabAction[];
}

const ICON: Record<Domain, ComponentType<IconProps>> = {
  INCOME: ArrowUpRight,
  EXPENSE: ArrowDown,
  INVESTMENT: TrendingUp,
  SAVING: Circle,
};

/** A domain's monthly figure on the dashboard, tinted in its colour. */
export function StatCard({
  title,
  amount,
  currency,
  domain,
  href,
  rows = [],
  categoryCount,
  byCurrency,
  actions,
}: Props) {
  const Icon = ICON[domain];
  return (
    <Card tint={domain}>
      <div className="head">
        <Link href={href} className="stat-head" aria-label={`Open ${title}`}>
          <IconDisc domain={domain} size={42}>
            <Icon size={18} />
          </IconDisc>
          <span className="title">{title}</span>
          <span className="chevron">
            <ChevronRight size={18} />
          </span>
        </Link>
      </div>

      <Amount value={amount} currency={currency} size="lg" />

      {rows.length > 0 && (
        <ul className="rows">
          {rows.map((r) => (
            <li key={r.name} className="row">
              <span className="row-name">{r.name}</span>
              <span className="row-value">{r.value}</span>
            </li>
          ))}
        </ul>
      )}

      {byCurrency && byCurrency.length > 1 && (
        <span className="currencies" aria-label="By currency">
          {byCurrency.map((c, i) => (
            <span key={c.currency}>
              {i > 0 && <span className="sep"> · </span>}
              {c.currency} {c.pct.toFixed(0)}%
            </span>
          ))}
        </span>
      )}

      <div className="foot">
        <span className="count">
          {categoryCount === undefined
            ? ""
            : `${categoryCount} categor${categoryCount === 1 ? "y" : "ies"}`}
        </span>
        {actions && actions.length > 0 && (
          <KebabMenu aria-label={`Actions for ${title}`} actions={actions} />
        )}
      </div>

      <style jsx>{`
        /* Link is a child component: its className carries no scope hash. */
        .head :global(.stat-head) {
          display: flex;
          align-items: center;
          gap: 10px;
          color: inherit;
          text-decoration: none;
        }

        .head :global(.stat-head:hover .chevron) {
          color: var(--fg-0);
        }

        .title {
          flex: 1;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--fg-0);
        }

        .chevron {
          display: inline-flex;
          color: var(--fg-2);
        }

        .rows {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 0.8rem;
        }

        .row-name {
          color: var(--fg-1);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .row-value {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          color: var(--fg-0);
          white-space: nowrap;
        }

        .currencies {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: var(--fg-2);
        }

        .sep {
          color: var(--line-strong);
        }

        .foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid var(--line);
          font-size: 0.75rem;
          color: var(--fg-2);
          min-height: 28px;
        }
      `}</style>
    </Card>
  );
}
