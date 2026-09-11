import { Card } from "../atoms/Card";
import { SectionTitle } from "../atoms/SectionTitle";
import { formatAmount } from "../atoms/Amount";
import { CategoryIcon } from "../atoms/CategoryIcon";
import { MoreHorizontal } from "../atoms/Icons";
import { IconDisc } from "./IconDisc";
import { ProgressBar } from "./ProgressBar";
import type { Category, Currency, Domain } from "../../types";

export interface CategoryRow {
  categoryId: string;
  name: string;
  amount: number;
  /** 0–100. */
  percent: number;
}

interface Props {
  title: string;
  rows: CategoryRow[];
  /** To resolve each row's icon; the aggregated "Other" row gets an ellipsis. */
  categories: Category[];
  domain: Domain;
  currency: Currency;
  /** "View all" destination… */
  href?: string;
  /** …or handler, when it switches something on the same page. */
  onViewAll?: () => void;
  loading?: boolean;
}

const DOMAIN_COLOR: Record<Domain, string> = {
  INCOME: "var(--domain-income)",
  EXPENSE: "var(--domain-expense)",
  INVESTMENT: "var(--domain-investment)",
  SAVING: "var(--domain-saving)",
};

/** "Top categories": icon, name, amount, share bar and percentage per row. */
export function CategoryBreakdown({
  title,
  rows,
  categories,
  domain,
  currency,
  href,
  onViewAll,
  loading,
}: Props) {
  const color = DOMAIN_COLOR[domain];
  return (
    <Card>
      <SectionTitle title={title} href={href} onAction={onViewAll} />
      {loading ? (
        <p className="empty">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="empty">No data yet</p>
      ) : (
        <ul className="rows">
          {rows.map((row) => (
            <CategoryBreakdownRow
              key={row.categoryId}
              row={row}
              category={categories.find((c) => c.id === row.categoryId)}
              domain={domain}
              currency={currency}
              color={color}
            />
          ))}
        </ul>
      )}
      <style jsx>{`
        .empty {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .rows {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
      `}</style>
    </Card>
  );
}

interface RowProps {
  row: CategoryRow;
  category?: Category;
  domain: Domain;
  currency: Currency;
  color: string;
}

function CategoryBreakdownRow({ row, category, domain, currency, color }: RowProps) {
  return (
    <li className="row">
      <IconDisc color={color} size={36}>
        {category ? <CategoryIcon category={category} size={16} /> : <MoreHorizontal size={16} />}
      </IconDisc>
      <span className="main">
        <span className="head">
          <span className="name">{row.name}</span>
          <span className="amount">{formatAmount(row.amount, currency)}</span>
        </span>
        <ProgressBar
          ratio={row.percent / 100}
          color={color}
          height={6}
          label={`${row.name} share`}
        />
      </span>
      <span className="pct">{row.percent.toFixed(0)}%</span>
      <style jsx>{`
        .row {
          display: flex;
          align-items: center;
          gap: 12px;
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
          align-items: baseline;
          gap: 10px;
        }

        .name {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--fg-0);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .amount {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.8rem;
          color: var(--fg-1);
          white-space: nowrap;
        }

        .pct {
          flex-shrink: 0;
          width: 36px;
          text-align: right;
          font-size: 0.78rem;
          color: var(--fg-2);
        }
      `}</style>
    </li>
  );
}
