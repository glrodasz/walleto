import { useState } from "react";
import type { Currency, RecurrentTransaction } from "../../../types";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { TransactionRow } from "../../../components/molecules/TransactionRow";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { formatDate } from "../../../helpers/dates";
import type { DateFormat } from "../../../types";
import { useDateFormat } from "../../../hooks/usePreferences";

interface Props {
  items: RecurrentTransaction[];
  displayCurrency: Currency;
  loading?: boolean;
  onMarkPaid?: (id: string) => Promise<void>;
  /** Hide the item from the dashboard (its domain page still shows it). */
  onHide?: (id: string) => Promise<void>;
}

function nextDate(ts: RecurrentTransaction["nextOccurrence"], format: DateFormat): string {
  if (!ts) return "—";
  const date =
    typeof (ts as { toDate?: () => Date }).toDate === "function"
      ? (ts as { toDate: () => Date }).toDate()
      : new Date(ts as unknown as string);
  return formatDate(date, "day", format);
}

export function UpcomingExpirations({
  items,
  displayCurrency,
  loading,
  onMarkPaid,
  onHide,
}: Props) {
  const { format } = useDateFormat();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const markPaid = async (id: string) => {
    if (!onMarkPaid) return;
    setPendingId(id);
    try {
      await onMarkPaid(id);
    } catch (err) {
      console.error("Failed to mark item paid:", err);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Card>
      <SectionTitle title="Next to expire" />

      {loading ? (
        <p className="empty">Loading…</p>
      ) : items.length === 0 ? (
        <p className="empty">No upcoming items</p>
      ) : (
        <ul className="list">
          {items.map((item) => (
            <TransactionRow
              key={item.id}
              name={item.name}
              amount={item.amount}
              currency={item.currency}
              displayCurrency={displayCurrency}
              meta={nextDate(item.nextOccurrence, format)}
              trailing={
                onMarkPaid &&
                item.id && (
                  <KebabMenu
                    aria-label={`Actions for ${item.name}`}
                    actions={[
                      {
                        label: pendingId === item.id ? "Marking paid…" : "Mark as paid",
                        onSelect: () => markPaid(item.id!),
                        disabled: pendingId === item.id,
                      },
                      ...(onHide
                        ? [
                            {
                              label: "Hide from dashboard",
                              onSelect: () =>
                                onHide(item.id!).catch((err) =>
                                  console.error("Failed to hide item:", err)
                                ),
                            },
                          ]
                        : []),
                    ]}
                  />
                )
              }
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
