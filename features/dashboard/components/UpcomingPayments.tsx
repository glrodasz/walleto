import type { Category, Currency, RecurrentTransaction } from "../../../types";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { formatNative } from "../../../components/atoms/Amount";
import { DateBadge } from "../../../components/molecules/DateBadge";

interface Props {
  items: RecurrentTransaction[];
  categories: Category[];
  displayCurrency: Currency;
  loading?: boolean;
}

function nextDate(ts: RecurrentTransaction["nextOccurrence"]): Date | null {
  if (!ts) return null;
  return typeof (ts as { toDate?: () => Date }).toDate === "function"
    ? (ts as { toDate: () => Date }).toDate()
    : new Date(ts as unknown as string);
}

/** The next recurring charges, soonest first, each with its category. */
export function UpcomingPayments({ items, categories, displayCurrency, loading }: Props) {
  return (
    <Card>
      <SectionTitle title="Upcoming payments" href="/expenses#recurring" />
      {loading ? (
        <p className="empty">Loading…</p>
      ) : items.length === 0 ? (
        <p className="empty">No upcoming items</p>
      ) : (
        <ul className="list">
          {items.map((item) => (
            <UpcomingRow
              key={item.id}
              item={item}
              date={nextDate(item.nextOccurrence)}
              category={categories.find((c) => c.id === item.categoryId)?.name}
              displayCurrency={displayCurrency}
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

        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </Card>
  );
}

interface RowProps {
  item: RecurrentTransaction;
  date: Date | null;
  category?: string;
  displayCurrency: Currency;
}

function UpcomingRow({ item, date, category, displayCurrency }: RowProps) {
  return (
    <li className="row">
      {date ? <DateBadge date={date} /> : <span className="no-date">—</span>}
      <span className="main">
        <span className="name">{item.name}</span>
        {category && <span className="category">{category}</span>}
      </span>
      <span className="amount">{formatNative(item.amount, item.currency, displayCurrency)}</span>
      <style jsx>{`
        .row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--line);
        }

        .row:last-child {
          border-bottom: none;
        }

        .no-date {
          width: 44px;
          text-align: center;
          color: var(--fg-2);
        }

        .main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .name {
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--fg-0);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .category {
          font-size: 0.75rem;
          color: var(--fg-2);
        }

        .amount {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.85rem;
          color: var(--fg-0);
          white-space: nowrap;
        }
      `}</style>
    </li>
  );
}
