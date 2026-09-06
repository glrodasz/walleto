import type { Currency, Transaction } from "../../../types";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { TransactionRow } from "../../../components/molecules/TransactionRow";
import { formatRelativeDay } from "../../../utils/formatRelativeDay";

interface Props {
  transactions: Transaction[];
  displayCurrency: Currency;
  loading?: boolean;
}

function formatDate(ts: Transaction["occurredAt"]): string {
  const date =
    typeof (ts as { toDate?: () => Date }).toDate === "function"
      ? (ts as { toDate: () => Date }).toDate()
      : new Date(ts as unknown as string);
  return formatRelativeDay(date);
}

export function RecentPayments({ transactions, displayCurrency, loading }: Props) {
  return (
    <Card>
      <SectionTitle title="Recent payments" />

      {loading ? (
        <p className="empty">Loading…</p>
      ) : transactions.length === 0 ? (
        <p className="empty">No data yet</p>
      ) : (
        <ul className="list">
          {transactions.map((t) => (
            <TransactionRow
              key={t.id}
              name={t.name}
              amount={t.amount}
              currency={t.currency}
              displayCurrency={displayCurrency}
              meta={formatDate(t.occurredAt)}
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
          gap: 10px;
        }
      `}</style>
    </Card>
  );
}
