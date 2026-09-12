import { useMemo } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { formatAmount, formatNative } from "../../../components/atoms/Amount";
import { Badge } from "../../../components/atoms/Badge";
import { Home } from "../../../components/atoms/Icons";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { ListItem, ListItems } from "../../../components/molecules/ListItem";
import type { KebabAction } from "../../../components/molecules/KebabMenu";
import { sumMonthly } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { paymentMethodOptionLabel } from "../../../helpers/paymentMethodLabel";
import { tagNames } from "../../../helpers/tags";
import { monthOccurrences } from "../helpers/months";
import type { MonthWindow, OccurrenceStatus } from "../helpers/months";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
import { FREQUENCY_LABELS } from "../../../constants";
import type {
  Category,
  Currency,
  Domain,
  PaymentMethod,
  RecurrentTransaction,
  Tag,
  Transaction,
} from "../../../types";
import { useDateFormat } from "../../../hooks/usePreferences";

interface Props {
  domain: Domain;
  items: RecurrentTransaction[];
  /** The selected month's PAID transactions. */
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  categories: Category[];
  /** The user's tags, to name an item's tag ids. */
  tags?: Tag[];
  ctx: MoneyContext;
  currency: Currency;
  window: MonthWindow;
  now?: Date;
  loading?: boolean;
  onMarkPaid: (itemId: string) => void;
  onEdit: (item: RecurrentTransaction) => void;
  onStop: (itemId: string) => void;
  /** Flip the item's hiddenFromDashboard flag. */
  onToggleHidden?: (item: RecurrentTransaction) => void;
  busyId: string | null;
}

const hiddenAction = (
  item: RecurrentTransaction,
  onToggleHidden?: (item: RecurrentTransaction) => void
): KebabAction[] =>
  onToggleHidden
    ? [
        {
          label: item.hiddenFromDashboard ? "Show on dashboard" : "Hide from dashboard",
          onSelect: () => onToggleHidden(item),
        },
      ]
    : [];

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

interface RowProps {
  name: string;
  meta: string;
  amount: string;
  status?: OccurrenceStatus;
  accent: string;
  actions: KebabAction[];
  /** Hidden from the dashboard — flagged with the house, the sidebar's own
   *  glyph for that screen, so it cannot be read as "hidden from the chart". */
  hidden?: boolean;
  /** The user's own tags. */
  labels?: string[];
  note?: string;
  muted?: boolean;
}

const STATUS_COLOR = (status: OccurrenceStatus, accent: string) =>
  status === "overdue" ? "var(--accent-hot)" : status === "paid" ? "var(--accent)" : accent;

/**
 * One checklist row: the shared ListItem, plus the two things only this list
 * has — the paid/due/overdue pill under the amount, and the kebab.
 */
function OccurrenceRow({
  name,
  meta,
  amount,
  status,
  accent,
  actions,
  hidden,
  labels,
  note,
  muted,
}: RowProps) {
  const flags = [
    ...(hidden
      ? [
          <Badge key="hidden" variant="outline" tone="warning" caps icon={<Home size={12} />}>
            Hidden
          </Badge>,
        ]
      : []),
    ...(labels ?? []).map((t) => (
      <Badge key={`label-${t}`} variant="outline">
        {t}
      </Badge>
    )),
  ];

  return (
    <ListItem
      name={name}
      badges={flags.length > 0 ? flags : undefined}
      note={note}
      meta={meta}
      muted={muted}
      amount={amount}
      amountMeta={
        status ? (
          <Badge color={STATUS_COLOR(status, accent)} caps>
            {STATUS_LABEL[status]}
          </Badge>
        ) : undefined
      }
      trailing={<KebabMenu aria-label={`Actions for ${name}`} actions={actions} />}
    />
  );
}

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
  categories,
  tags = [],
  ctx,
  currency,
  window,
  now,
  loading,
  onMarkPaid,
  onEdit,
  onStop,
  onToggleHidden,
  busyId,
}: Props) {
  const { formatDate } = useDateFormat();
  const config = DOMAIN_CONFIG[domain];
  const { occurrences, notThisMonth } = useMemo(
    () => monthOccurrences(items, transactions, ctx, window, now),
    [items, transactions, ctx, window, now]
  );
  const runRate = useMemo(() => sumMonthly(items, ctx), [items, ctx]);
  // Where it is filed and how it is paid, both in full — the row is the one
  // place that answers "which card, which bucket" at a glance.
  const details = (item: RecurrentTransaction) => {
    const category = categories.find((c) => c.id === item.categoryId)?.name;
    const method = paymentMethods.find((pm) => pm.id === item.paymentMethodId);
    return [category, method ? paymentMethodOptionLabel(method) : null]
      .filter(Boolean)
      .map((part) => ` · ${part}`)
      .join("");
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
                <ListItems>
                  {rows.map((o) => {
                    const id = o.item.id!;
                    const busy = busyId === id;
                    return (
                      <OccurrenceRow
                        key={`${id}_${o.occurredAt.toISOString()}`}
                        name={o.item.name}
                        meta={`${formatDate(o.occurredAt, "day")} · ${FREQUENCY_LABELS[o.item.frequency]}${details(o.item)}`}
                        hidden={Boolean(o.item.hiddenFromDashboard)}
                        labels={tagNames(o.item.tags, tags)}
                        note={o.item.note}
                        muted={Boolean(o.item.hiddenFromDashboard)}
                        amount={formatNative(o.item.amount, o.item.currency, currency)}
                        status={o.status}
                        accent={config.accent}
                        actions={[
                          ...(o.status !== "paid"
                            ? [
                                {
                                  label: busy ? "Marking…" : "Mark as paid",
                                  onSelect: () => onMarkPaid(id),
                                  disabled: busy,
                                },
                              ]
                            : []),
                          { label: "Edit", onSelect: () => onEdit(o.item) },
                          ...hiddenAction(o.item, onToggleHidden),
                          {
                            label: "Stop",
                            onSelect: () => onStop(id),
                            danger: true,
                            disabled: busy,
                          },
                        ]}
                      />
                    );
                  })}
                </ListItems>
              </section>
            );
          })}

          {notThisMonth.length > 0 && (
            <details className="later">
              <summary>Not this month ({notThisMonth.length})</summary>
              <ListItems>
                {notThisMonth.map((item) => (
                  <OccurrenceRow
                    key={item.id}
                    name={item.name}
                    meta={`${FREQUENCY_LABELS[item.frequency]}${
                      item.nextOccurrence
                        ? ` · next ${formatDate(item.nextOccurrence.toDate(), "day")}`
                        : ""
                    }`}
                    amount={formatNative(item.amount, item.currency, currency)}
                    accent={config.accent}
                    hidden={Boolean(item.hiddenFromDashboard)}
                    labels={tagNames(item.tags, tags)}
                    note={item.note}
                    muted={Boolean(item.hiddenFromDashboard)}
                    actions={[
                      { label: "Edit", onSelect: () => onEdit(item) },
                      ...hiddenAction(item, onToggleHidden),
                      {
                        label: "Stop",
                        onSelect: () => item.id && onStop(item.id),
                        danger: true,
                      },
                    ]}
                  />
                ))}
              </ListItems>
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
