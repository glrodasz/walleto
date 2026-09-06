import { useMemo } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { TransactionRow } from "../../../components/molecules/TransactionRow";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { formatRelativeDay } from "../../../utils/formatRelativeDay";
import type { Currency, Transaction } from "../../../types";

interface Props {
  title: string;
  /** Already scoped to the period and the selected category. */
  transactions: Transaction[];
  displayCurrency: Currency;
  loading?: boolean;
  onDelete: (transactionId: string) => void;
  deletingId: string | null;
}

const LIMIT = 20;

/**
 * What actually happened in the period, newest first, including the rows the
 * materializer wrote for recurring items. Deleting one skips that single
 * occurrence; the recurring plan itself lives in the table above.
 */
export function PeriodTransactionsList({
  title,
  transactions,
  displayCurrency,
  loading,
  onDelete,
  deletingId,
}: Props) {
  const sorted = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => b.occurredAt.toDate().getTime() - a.occurredAt.toDate().getTime()
      ),
    [transactions]
  );
  const shown = sorted.slice(0, LIMIT);
  const hidden = sorted.length - shown.length;

  return (
    <Card>
      <SectionTitle title={title} />

      {loading ? (
        <p className="empty">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="empty">Nothing recorded in this period</p>
      ) : (
        <ul className="list">
          {shown.map((t) => (
            <TransactionRow
              key={t.id}
              name={t.name}
              amount={t.amount}
              currency={t.currency}
              displayCurrency={displayCurrency}
              meta={`${formatRelativeDay(t.occurredAt.toDate())}${
                t.recurrentTransactionId ? " · recurring" : ""
              }`}
              trailing={
                <KebabMenu
                  aria-label={`Actions for ${t.name}`}
                  actions={[
                    {
                      label: deletingId === t.id ? "Deleting…" : "Delete",
                      onSelect: () => t.id && onDelete(t.id),
                      danger: true,
                      disabled: deletingId === t.id,
                    },
                  ]}
                />
              }
            />
          ))}
        </ul>
      )}

      {hidden > 0 && <p className="more">and {hidden} more in this period</p>}

      <style jsx>{`
        .empty,
        .more {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .more {
          margin-top: 10px;
          font-size: 0.75rem;
        }

        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      `}</style>
    </Card>
  );
}
