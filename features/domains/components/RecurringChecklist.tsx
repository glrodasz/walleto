import { useMemo } from "react";
import type { ReactNode } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { Badge } from "../../../components/atoms/Badge";
import { Home, Shuffle } from "../../../components/atoms/Icons";
import { KebabMenu, KebabSpacer } from "../../../components/molecules/KebabMenu";
import { RangeAmount } from "../../../components/atoms/RangeAmount";
import { ListItem, ListItems } from "../../../components/molecules/ListItem";
import type { KebabAction } from "../../../components/molecules/KebabMenu";
import { sumMonthly } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { paymentMethodOptionLabel } from "../../../helpers/paymentMethodLabel";
import { tagNames } from "../../../helpers/tags";
import { toDate } from "../../../helpers/chartData";
import { monthOccurrences } from "../helpers/months";
import type { MonthOccurrence, MonthWindow, OccurrenceStatus } from "../helpers/months";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
import { SLOT, splitSlot } from "../helpers/slot";
import { useT } from "../../../hooks/useT";
import type { Translator } from "../../../helpers/i18n";
import { COMMON_MESSAGES } from "../../../messages/common";
import { DOMAIN_MESSAGES } from "../messages";
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
  /** PAID transactions. Not just the month's: a payment moved to another
   *  month still settles its own occurrence, matched by id. */
  transactions: Transaction[];
  /** SKIPPED transactions: payments removed from Activity, matched by id. */
  skipped?: Transaction[];
  paymentMethods: PaymentMethod[];
  categories: Category[];
  /** The user's tags, to name an item's tag ids. */
  tags?: Tag[];
  ctx: MoneyContext;
  currency: Currency;
  window: MonthWindow;
  now?: Date;
  loading?: boolean;
  /** Pay that exact occurrence: an overdue one sits behind the item's nextOccurrence. */
  onMarkPaid: (itemId: string, occurredAt: Date) => void;
  onEdit: (item: RecurrentTransaction) => void;
  onStop: (itemId: string) => void;
  /** Flip the item's hiddenFromDashboard flag. */
  onToggleHidden?: (item: RecurrentTransaction) => void;
  busyId: string | null;
}

type DomainT = Translator<(typeof DOMAIN_MESSAGES)["en"]>;

const hiddenAction = (
  t: DomainT,
  item: RecurrentTransaction,
  onToggleHidden?: (item: RecurrentTransaction) => void
): KebabAction[] =>
  onToggleHidden
    ? [
        {
          label: item.hiddenFromDashboard ? t("plan.showOnDashboard") : t("plan.hideFromDashboard"),
          onSelect: () => onToggleHidden(item),
        },
      ]
    : [];

const NO_ROWS: Transaction[] = [];

const GROUPS: OccurrenceStatus[] = ["overdue", "due", "paid", "skipped"];

interface RowProps {
  name: string;
  meta: string;
  amount: ReactNode;
  status?: OccurrenceStatus;
  /** What was paid, when it differs from the plan: rides the "Paid" pill. */
  paidAmount?: string;
  accent: string;
  actions: KebabAction[];
  /** Hidden from the dashboard — flagged with the house, the sidebar's own
   *  glyph for that screen, so it cannot be read as "hidden from the chart".
   *  Not dimmed: the item still counts on its domain page. */
  hidden?: boolean;
  /** A variable expense: its amount is a band, not a fixed price. */
  variable?: boolean;
  /** The user's own tags. */
  labels?: string[];
  note?: string;
}

const STATUS_COLOR = (status: OccurrenceStatus, accent: string) =>
  status === "overdue"
    ? "var(--negative)"
    : status === "paid"
      ? "var(--positive)"
      : status === "skipped"
        ? "var(--fg-2)"
        : accent;

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** The paid row says something the plan doesn't: another amount, or a band confirmed. */
const paidDiffers = ({ item, paid }: MonthOccurrence) =>
  paid !== undefined &&
  (paid.amount !== item.amount ||
    paid.currency !== item.currency ||
    paid.amountFloor !== item.amountFloor);

/**
 * One checklist row: the shared ListItem, plus the two things only this list
 * has — the paid/due/overdue pill under the amount, and the kebab.
 */
function OccurrenceRow({
  name,
  meta,
  amount,
  status,
  paidAmount,
  accent,
  actions,
  hidden,
  variable,
  labels,
  note,
}: RowProps) {
  const t = useT(DOMAIN_MESSAGES);
  const common = useT(COMMON_MESSAGES);
  const flags = [
    ...(variable
      ? [
          <Badge key="variable" variant="outline" tone="info" caps icon={<Shuffle size={12} />}>
            {common("state.variable")}
          </Badge>,
        ]
      : []),
    ...(hidden
      ? [
          <Badge key="hidden" variant="outline" tone="warning" caps icon={<Home size={12} />}>
            {common("state.hidden")}
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
    <>
      <ListItem
        name={name}
        badges={flags.length > 0 ? flags : undefined}
        note={note}
        meta={meta}
        muted={status === "skipped"}
        amount={amount}
        amountMeta={
          status ? (
            <Badge color={STATUS_COLOR(status, accent)} caps>
              {t(`plan.status.${status}`)}
              {paidAmount && <span className="paid-amount">{paidAmount}</span>}
            </Badge>
          ) : undefined
        }
        trailing={
          <KebabMenu aria-label={common("action.actionsFor", { name })} actions={actions} />
        }
      />
      <style jsx>{`
        .paid-amount {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          text-transform: none;
          letter-spacing: 0;
        }
      `}</style>
    </>
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
  skipped = NO_ROWS,
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
  const { formatDate, language } = useDateFormat();
  const { formatAmount, formatNative, formatNativeRange } = useMoneyFormat();
  // A variable item reads as its band, "€400 – €600".
  const itemAmount = (item: Pick<RecurrentTransaction, "amount" | "amountFloor" | "currency">) =>
    item.amountFloor !== undefined ? (
      <RangeAmount
        from={formatNative(item.amountFloor, item.currency, currency)}
        to={formatNative(item.amount, item.currency, currency)}
      />
    ) : (
      formatNative(item.amount, item.currency, currency)
    );
  const t = useT(DOMAIN_MESSAGES);
  const common = useT(COMMON_MESSAGES);
  const config = DOMAIN_CONFIG[domain];
  const { occurrences, notThisMonth } = useMemo(
    () => monthOccurrences(items, transactions, ctx, window, now, skipped),
    [items, transactions, ctx, window, now, skipped]
  );
  const runRate = useMemo(() => sumMonthly(items, ctx), [items, ctx]);
  // Where it is filed and how it is paid, both in full — the row is the one
  // place that answers "which card, which bucket" at a glance.
  const details = (item: RecurrentTransaction) => {
    const category = categories.find((c) => c.id === item.categoryId)?.name;
    const method = paymentMethods.find((pm) => pm.id === item.paymentMethodId);
    return [category, method ? paymentMethodOptionLabel(method, language) : null]
      .filter(Boolean)
      .map((part) => ` · ${part}`)
      .join("");
  };

  // The row is the plan: its day and the item's price today. What the ledger
  // says only shows when it differs — the day it moved to, the amount on the
  // pill — so a paid month never reads as next month's price.
  const occurrenceDate = (o: MonthOccurrence) => {
    const planned = formatDate(o.occurredAt, "day");
    const paidAt = o.paid ? toDate(o.paid.occurredAt) : null;
    return paidAt && !sameDay(paidAt, o.occurredAt)
      ? t("plan.moved", { planned, paid: formatDate(paidAt, "day") })
      : planned;
  };
  const paidAmount = (o: MonthOccurrence) =>
    o.paid && paidDiffers(o)
      ? o.paid.amountFloor !== undefined
        ? formatNativeRange(o.paid.amountFloor, o.paid.amount, o.paid.currency, currency)
        : formatNative(o.paid.amount, o.paid.currency, currency)
      : undefined;

  const [runRateBefore, runRateAfter] = splitSlot(t(`plan.runRate.${domain}`, { amount: SLOT }));

  return (
    <Card>
      <SectionTitle
        title={common("noun.plan")}
        subtitle={t("plan.subtitle", { month: window.longLabel })}
      />

      {loading ? (
        <p className="empty">{common("state.loading")}</p>
      ) : occurrences.length === 0 && notThisMonth.length === 0 ? (
        <p className="empty">{t("plan.empty")}</p>
      ) : (
        <>
          {GROUPS.map((status) => {
            const rows = occurrences.filter((o) => o.status === status);
            if (rows.length === 0) return null;
            // Skipped didn't happen: nothing to add up.
            const total = status === "skipped" ? null : rows.reduce((sum, o) => sum + o.amount, 0);
            return (
              <section key={status} className="group">
                <h3 className="group-title">
                  <span>{t(`plan.group.${status}`)}</span>
                  {/* The kebab's room on the right, so the total sits over the
                      rows' amounts. */}
                  <span className="group-end">
                    {total !== null && (
                      <span className="group-total">{formatAmount(total, currency)}</span>
                    )}
                    <KebabSpacer />
                  </span>
                </h3>
                <ListItems>
                  {rows.map((o) => {
                    const id = o.item.id!;
                    const busy = busyId === id;
                    return (
                      <OccurrenceRow
                        key={`${id}_${o.occurredAt.toISOString()}`}
                        name={o.item.name}
                        meta={`${occurrenceDate(o)} · ${common(`frequency.${o.item.frequency}`)}${details(o.item)}`}
                        hidden={Boolean(o.item.hiddenFromDashboard)}
                        variable={o.item.amountFloor !== undefined}
                        labels={tagNames(o.item.tags, tags)}
                        note={o.item.note}
                        amount={itemAmount(o.item)}
                        status={o.status}
                        paidAmount={paidAmount(o)}
                        accent={config.accent}
                        actions={[
                          ...(o.status !== "paid"
                            ? [
                                {
                                  label: busy ? t("plan.marking") : t("plan.markPaid"),
                                  onSelect: () => onMarkPaid(id, o.occurredAt),
                                  disabled: busy,
                                },
                              ]
                            : []),
                          { label: common("action.edit"), onSelect: () => onEdit(o.item) },
                          ...hiddenAction(t, o.item, onToggleHidden),
                          {
                            label: t("plan.stop"),
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
              <summary>{t("plan.notThisMonth", { count: notThisMonth.length })}</summary>
              <ListItems>
                {notThisMonth.map((item) => (
                  <OccurrenceRow
                    key={item.id}
                    name={item.name}
                    meta={`${common(`frequency.${item.frequency}`)}${
                      item.nextOccurrence
                        ? ` · ${t("plan.next", { date: formatDate(item.nextOccurrence.toDate(), "day") })}`
                        : ""
                    }`}
                    amount={itemAmount(item)}
                    accent={config.accent}
                    hidden={Boolean(item.hiddenFromDashboard)}
                    variable={item.amountFloor !== undefined}
                    labels={tagNames(item.tags, tags)}
                    note={item.note}
                    actions={[
                      { label: common("action.edit"), onSelect: () => onEdit(item) },
                      ...hiddenAction(t, item, onToggleHidden),
                      {
                        label: t("plan.stop"),
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
            {runRateBefore}
            <strong>{formatAmount(runRate, currency)}</strong>
            {runRateAfter}
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

        .group-end {
          display: inline-flex;
          align-items: center;
          /* Same gap as ListItem's row between the amount and its kebab. */
          gap: 8px;
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
