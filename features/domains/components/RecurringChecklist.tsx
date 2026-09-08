import { useMemo } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { formatAmount, formatNative } from "../../../components/atoms/Amount";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { sumMonthly } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { paymentMethodLabel } from "../../../helpers/paymentMethodLabel";
import { monthOccurrences } from "../helpers/months";
import type { MonthOccurrence, MonthWindow, OccurrenceStatus } from "../helpers/months";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
import { FREQUENCY_LABELS } from "../../../constants";
import type {
  Currency,
  Domain,
  PaymentMethod,
  RecurrentTransaction,
  Transaction,
} from "../../../types";

interface Props {
  domain: Domain;
  items: RecurrentTransaction[];
  /** The selected month's PAID transactions. */
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  ctx: MoneyContext;
  currency: Currency;
  window: MonthWindow;
  now?: Date;
  loading?: boolean;
  onMarkPaid: (itemId: string) => void;
  onEdit: (item: RecurrentTransaction) => void;
  onStop: (itemId: string) => void;
  busyId: string | null;
}

const DATE = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const GROUPS: { status: OccurrenceStatus; title: string }[] = [
  { status: "overdue", title: "Overdue" },
  { status: "due", title: "Due" },
  { status: "paid", title: "Paid" },
];
const STATUS_LABEL: Record<OccurrenceStatus, string> = {
  overdue: "Overdue",
  due: "Due",
  paid: "Paid",
};

/**
 * The month's bills as a checklist. Recurring items stop pretending to be
 * the ledger: what happened lives under Transactions, the plan lives here,
 * and paid / due / overdue is the state that matters.
 */
export function RecurringChecklist({
  domain,
  items,
  transactions,
  paymentMethods,
  ctx,
  currency,
  window,
  now,
  loading,
  onMarkPaid,
  onEdit,
  onStop,
  busyId,
}: Props) {
  const config = DOMAIN_CONFIG[domain];
  const { occurrences, notThisMonth } = useMemo(
    () => monthOccurrences(items, transactions, ctx, window, now),
    [items, transactions, ctx, window, now]
  );
  const runRate = useMemo(() => sumMonthly(items, ctx), [items, ctx]);
  const methodName = (id?: string) => {
    const m = paymentMethods.find((pm) => pm.id === id);
    return m ? paymentMethodLabel(m) : null;
  };

  const renderRow = (o: MonthOccurrence) => {
    const id = o.item.id!;
    const busy = busyId === id;
    const canPay = o.status !== "paid";
    return (
      <li key={`${id}_${o.occurredAt.toISOString()}`} className={`row ${o.status}`}>
        <span className="main">
          <span className="name">{o.item.name}</span>
          <span className="meta">
            {DATE.format(o.occurredAt)} · {FREQUENCY_LABELS[o.item.frequency]}
            {methodName(o.item.paymentMethodId) ? ` · ${methodName(o.item.paymentMethodId)}` : ""}
          </span>
        </span>
        <span className="right">
          <span className="amount">{formatNative(o.item.amount, o.item.currency, currency)}</span>
          <span className={`pill ${o.status}`}>{STATUS_LABEL[o.status]}</span>
        </span>
        <KebabMenu
          aria-label={`Actions for ${o.item.name}`}
          actions={[
            ...(canPay
              ? [
                  {
                    label: busy ? "Marking…" : "Mark as paid",
                    onSelect: () => onMarkPaid(id),
                    disabled: busy,
                  },
                ]
              : []),
            { label: "Edit", onSelect: () => onEdit(o.item) },
            { label: "Stop", onSelect: () => onStop(id), danger: true, disabled: busy },
          ]}
        />
      </li>
    );
  };

  return (
    <Card>
      <SectionTitle title="Recurring" />

      {loading ? (
        <p className="empty">Loading…</p>
      ) : occurrences.length === 0 && notThisMonth.length === 0 ? (
        <p className="empty">No recurring {config.noun} yet</p>
      ) : (
        <>
          {GROUPS.map((g) => {
            const rows = occurrences.filter((o) => o.status === g.status);
            if (rows.length === 0) return null;
            const total = rows.reduce((sum, o) => sum + o.amount, 0);
            return (
              <section key={g.status} className="group">
                <h3 className="group-title">
                  <span>{g.title}</span>
                  <span className="group-total">{formatAmount(total, currency)}</span>
                </h3>
                <ul className="list">{rows.map(renderRow)}</ul>
              </section>
            );
          })}

          {notThisMonth.length > 0 && (
            <details className="later">
              <summary>Not this month ({notThisMonth.length})</summary>
              <ul className="list">
                {notThisMonth.map((item) => (
                  <li key={item.id} className="row later-row">
                    <span className="main">
                      <span className="name">{item.name}</span>
                      <span className="meta">
                        {FREQUENCY_LABELS[item.frequency]}
                        {item.nextOccurrence
                          ? ` · next ${DATE.format(item.nextOccurrence.toDate())}`
                          : ""}
                      </span>
                    </span>
                    <span className="amount">
                      {formatNative(item.amount, item.currency, currency)}
                    </span>
                    <KebabMenu
                      aria-label={`Actions for ${item.name}`}
                      actions={[
                        { label: "Edit", onSelect: () => onEdit(item) },
                        {
                          label: "Stop",
                          onSelect: () => item.id && onStop(item.id),
                          danger: true,
                        },
                      ]}
                    />
                  </li>
                ))}
              </ul>
            </details>
          )}

          <p className="footer">
            {config.runRateLabel}: <strong>{formatAmount(runRate, currency)}</strong>/mo
          </p>
        </>
      )}

      <style jsx>{`
        .empty {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .group {
          margin-bottom: 14px;
        }

        .group-title {
          display: flex;
          justify-content: space-between;
          margin: 0 0 6px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--fg-2);
        }

        .group-total {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          letter-spacing: 0;
          text-transform: none;
        }

        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }

        .row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid var(--line);
        }

        .row:last-child {
          border-bottom: none;
        }

        .row.paid .name {
          color: var(--fg-1);
        }

        .main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .name {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--fg-0);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .meta {
          font-size: 0.72rem;
          color: var(--fg-2);
        }

        .right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
          flex-shrink: 0;
        }

        .amount {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--fg-0);
          white-space: nowrap;
        }

        .pill {
          font-size: 0.66rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 999px;
          background: var(--bg-3);
          color: var(--fg-2);
        }

        .pill.due {
          color: ${config.accent};
          background: color-mix(in srgb, ${config.accent} 14%, transparent);
        }

        .pill.overdue {
          color: var(--accent-hot);
          background: color-mix(in srgb, var(--accent-hot) 14%, transparent);
        }

        .pill.paid {
          color: var(--accent);
          background: color-mix(in srgb, var(--accent) 12%, transparent);
        }

        .later {
          margin-top: 6px;
        }

        .later summary {
          cursor: pointer;
          font-size: 0.8rem;
          color: var(--fg-2);
          padding: 6px 0;
        }

        .footer {
          margin: 12px 0 0;
          padding-top: 10px;
          border-top: 1px solid var(--line);
          font-size: 0.8rem;
          color: var(--fg-2);
        }

        .footer strong {
          color: var(--fg-0);
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </Card>
  );
}
