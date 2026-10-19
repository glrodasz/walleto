import { useId, useState } from "react";
import { Card } from "../atoms/Card";
import { SectionTitle } from "../atoms/SectionTitle";
import { TextField } from "../atoms/TextField";
import { Select } from "../atoms/Select";
import { Badge } from "../atoms/Badge";
import { CategoryIcon } from "../atoms/CategoryIcon";
import { Chart, Home, Repeat, Search, Sliders } from "../atoms/Icons";
import { useMoneyFormat } from "../../hooks/useMoneyFormat";
import { KebabMenu } from "./KebabMenu";
import { IconDisc } from "./IconDisc";
import { ListItem, ListItems } from "./ListItem";
import { useTransactionFilters } from "../../features/domains/hooks/useTransactionFilters";
import { NO_METHOD } from "../../features/domains/helpers/transactionFilters";
import { isSyntheticRow } from "../../features/domains/helpers/spread";
import type { HiddenReason } from "../../helpers/hidden";
import type { TransactionFilters } from "../../features/domains/helpers/transactionFilters";
import { useDateFormat } from "../../hooks/usePreferences";
import { useT } from "../../hooks/useT";
import { CHART_MESSAGES } from "../../messages/charts";
import { COMMON_MESSAGES } from "../../messages/common";
import { TRANSACTION_MESSAGES } from "../../messages/transactions";
import { paymentMethodLabel, paymentMethodOptionLabel } from "../../helpers/paymentMethodLabel";
import { tagNames } from "../../helpers/tags";
import { directionLabel, isAccountDomain } from "../../helpers/accounts";
import { toDate } from "../../helpers/chartData";
import { convertedAmount } from "../../helpers/aggregations";
import type { MoneyContext } from "../../helpers/aggregations";
import type {
  Category,
  Currency,
  Domain,
  PaymentMethod,
  RecurrentTransaction,
  Tag,
  Transaction,
} from "../../types";

interface Props {
  title: string;
  subtitle?: string;
  /** Already scoped to the month (and, in a drilldown, the category). */
  rows: Transaction[];
  domain: Domain;
  categories: Category[];
  methods?: PaymentMethod[];
  tags?: Tag[];
  /** The domain's recurring items, to say which one wrote a row. */
  items?: RecurrentTransaction[];
  displayCurrency: Currency;
  ctx: MoneyContext;
  loading?: boolean;
  onEdit?: (transaction: Transaction) => void;
  /** Opens a recurring item: where a "reflected monthly" share is edited. */
  onOpenItem?: (item: RecurrentTransaction) => void;
  /**
   * Every rule hiding a row: off the domain chart ("chart", by its recurring
   * item or its category) and/or off the dashboard ("dashboard", by its
   * recurring item). One pill each, since they are undone in different
   * places; the row dims only when it is off this page's chart.
   */
  hiddenReasons?: (transaction: Transaction) => HiddenReason[];
  onDelete: (transactionId: string) => void;
  deletingId: string | null;
  /** Whether the payment method belongs in this domain's rows and filters. */
  showMethod?: boolean;
  /** Hide the category filter (a drilldown already fixed the category). */
  showCategoryFilter?: boolean;
  /** Starting filters, e.g. when another view sends the user here narrowed down. */
  initialFilters?: Partial<TransactionFilters>;
  /** Clears the filters when it changes (the selected month). */
  resetKey?: string;
  /** Called whenever the search, filters or sort change. */
  onFiltersChange?: (filters: TransactionFilters) => void;
  /** Rows shown before the "and N more" line. A month is bounded; 60 covers it. */
  limit?: number;
}

/**
 * The ledger, one ListItem per payment: name and amount first, then the
 * date · category · method · origin line. It was a table with a sortable
 * header; at phone width three of its cells shared one grid area and painted
 * on top of each other, and the columns never earned their width anyway.
 * Sorting moved into a control that works the same at every size.
 */
export function TransactionsTable({
  title,
  subtitle,
  rows,
  domain,
  categories,
  methods = [],
  tags = [],
  items = [],
  displayCurrency,
  ctx,
  loading,
  onEdit,
  onOpenItem,
  hiddenReasons,
  onDelete,
  deletingId,
  showMethod = true,
  showCategoryFilter = true,
  initialFilters,
  resetKey,
  onFiltersChange,
  limit = 60,
}: Props) {
  const { language } = useDateFormat();
  const tr = useT(TRANSACTION_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  const tch = useT(CHART_MESSAGES);
  const filter = useTransactionFilters({
    rows,
    categories,
    tags,
    ctx,
    initial: initialFilters,
    resetKey,
    onChange: onFiltersChange,
  });
  const shown = filter.rows.slice(0, limit);
  const hidden = filter.rows.length - shown.length;
  const roots = categories.filter((c) => !c.parentId);
  // Two or three controls depending on the domain; the row splits evenly
  // either way, so the count is a custom property rather than a special case.
  const filterCount = 1 + (showCategoryFilter ? 1 : 0) + (showMethod ? 1 : 0);
  const panelId = useId();
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <Card>
      <SectionTitle title={title} subtitle={subtitle} />

      <div className="toolbar" role="search">
        <div className="find">
          <div className="search">
            <TextField
              icon={<Search size={16} />}
              aria-label={tr("search.label")}
              placeholder={tr("search.placeholder")}
              value={filter.filters.search}
              onValueChange={(v) => filter.set("search", v)}
            />
          </div>
          {/* Phone only — hidden by CSS from 768px up, where the panel is
              always open and this button has no job. */}
          <button
            type="button"
            className="glass glass--tap toggle"
            aria-expanded={filtersOpen}
            aria-controls={panelId}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <Sliders size={16} />
            {tr("filters.toggle")}
            {filter.narrowCount > 0 && <span className="count">{filter.narrowCount}</span>}
          </button>
        </div>

        {/*
         * The panel is always rendered and the media query decides whether it
         * shows: one DOM for both widths, so there is no matchMedia in render
         * and nothing to mismatch on hydration.
         */}
        <div
          id={panelId}
          className={`filters${filtersOpen ? " is-open" : ""}`}
          style={{ "--filters": filterCount } as React.CSSProperties}
        >
          {showCategoryFilter && (
            <Select
              aria-label={tr("filters.category")}
              options={[
                { value: "", label: tr("filters.allCategories") },
                ...roots.map((c) => ({ value: c.id!, label: c.name })),
              ]}
              value={filter.filters.categoryId}
              onValueChange={(v) => filter.set("categoryId", v)}
            />
          )}
          {showMethod && (
            <Select
              aria-label={tr("filters.method")}
              options={[
                { value: "", label: tr("filters.allMethods") },
                ...methods.map((m) => ({
                  value: m.id!,
                  label: paymentMethodOptionLabel(m, language),
                })),
                { value: NO_METHOD, label: tr("filters.noMethod") },
              ]}
              value={filter.filters.paymentMethodId}
              onValueChange={(v) => filter.set("paymentMethodId", v)}
            />
          )}
          <Select
            aria-label={tr("filters.sort")}
            options={SORT_KEYS.map((value) => ({ value, label: tr(`sort.${value}`) }))}
            value={`${filter.filters.sort.by}-${filter.filters.sort.dir}`}
            onValueChange={(v) => filter.set("sort", parseSort(v))}
          />
        </div>

        {filter.active && (
          <button type="button" className="clear" onClick={filter.reset}>
            {tc("action.clear")}
          </button>
        )}
      </div>

      {loading ? (
        <p className="empty">{tc("state.loading")}</p>
      ) : shown.length === 0 ? (
        <p className="empty">{rows.length === 0 ? tch("chart.empty") : tr("filters.noMatch")}</p>
      ) : (
        <ListItems>
          {shown.map((t) => (
            <TransactionListRow
              key={t.id}
              transaction={t}
              domain={domain}
              category={categories.find((c) => c.id === t.categoryId)}
              method={methods.find((m) => m.id === t.paymentMethodId)}
              item={items.find((i) => i.id === t.recurrentTransactionId)}
              labels={tagNames(t.tags, tags)}
              displayCurrency={displayCurrency}
              ctx={ctx}
              showMethod={showMethod}
              hidden={hiddenReasons?.(t) ?? []}
              onEdit={onEdit}
              onOpenItem={onOpenItem}
              onDelete={onDelete}
              deleting={deletingId === t.id}
            />
          ))}
        </ListItems>
      )}

      {hidden > 0 && <p className="more">{tr("more", { count: hidden })}</p>}

      <style jsx>{`
        /* Two rows: the search owns the first, the filters share the second. */
        .toolbar {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .find {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .search {
          flex: 1;
          min-width: 0;
        }

        /* Whatever is rendered — two controls or three — splits the row evenly. */
        .filters {
          display: grid;
          grid-template-columns: repeat(var(--filters, 2), minmax(0, 1fr));
          gap: 10px;
        }

        .toggle {
          display: none;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          height: var(--input-height);
          padding: 0 14px;
          border-radius: var(--r-pill);
          color: var(--fg-1);
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .toggle[aria-expanded="true"] {
          color: var(--accent);
        }

        .count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: var(--r-pill);
          background: var(--accent);
          color: var(--on-accent);
          font-size: 0.68rem;
          font-weight: 700;
        }

        @media (max-width: 767px) {
          /* Four stacked boxes before the first transaction is most of the
             screen. The filters fold behind the button beside the search and
             open under it, one per row, when they are asked for. */
          .toggle {
            display: inline-flex;
          }

          .filters {
            display: none;
            grid-template-columns: 1fr;
          }

          .filters.is-open {
            display: grid;
          }
        }

        .clear {
          border: none;
          background: transparent;
          color: var(--accent);
          font-family: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 8px;
        }

        .empty,
        .more {
          margin: 0;
          font-size: 0.8rem;
          color: var(--fg-2);
        }
      `}</style>
    </Card>
  );
}

const SORT_KEYS = ["date-desc", "date-asc", "amount-desc", "amount-asc"] as const;

/** "amount-asc" back into the filter state's { by, dir }. */
function parseSort(value: string): TransactionFilters["sort"] {
  const [by, dir] = value.split("-");
  return { by: by === "amount" ? "amount" : "date", dir: dir === "asc" ? "asc" : "desc" };
}

interface RowProps {
  transaction: Transaction;
  domain: Domain;
  category?: Category;
  method?: PaymentMethod;
  item?: RecurrentTransaction;
  labels: string[];
  displayCurrency: Currency;
  ctx: MoneyContext;
  showMethod: boolean;
  hidden: HiddenReason[];
  onEdit?: (transaction: Transaction) => void;
  onOpenItem?: (item: RecurrentTransaction) => void;
  onDelete: (transactionId: string) => void;
  deleting: boolean;
}

/** One ledger row: everything but the name and the amount folds into one line. */
function TransactionListRow({
  transaction: t,
  domain,
  category,
  method,
  item,
  labels,
  displayCurrency,
  ctx,
  showMethod,
  hidden,
  onEdit,
  onOpenItem,
  onDelete,
  deleting,
}: RowProps) {
  const { formatDate, language } = useDateFormat();
  const { formatAmount, formatNative } = useMoneyFormat();
  const tr = useT(TRANSACTION_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  const cadence = item ? tc(`frequency.${item.frequency}`) : "";
  // A "reflected monthly" share is not a payment: it is the month's slice of
  // a yearly (quarterly…) item, derived from it and edited only through it.
  // It names the payment it spreads and the months that payment covers, so
  // a slice of last year's renewal reads apart from this year's.
  const share = isSyntheticRow(t);
  const date = toDate(t.occurredAt);
  // "recurring · Monthly", plus the item's name when the row was renamed;
  // a stopped item no longer resolves, so the row just says "recurring". A
  // row older than the item's start was paid under an earlier schedule, so
  // the item's cadence today would mislabel it.
  const origin = share
    ? item && t.cycle
      ? tr(t.cycle.paid ? "origin.cyclePaid" : "origin.cyclePlanned", {
          cadence: cadence.toLocaleLowerCase(),
          amount: formatNative(t.cycle.amount, t.cycle.currency, displayCurrency),
        })
      : item
        ? tr("origin.shareOf", {
            amount: formatNative(item.amount, item.currency, displayCurrency),
            cadence: cadence.toLocaleLowerCase(),
          })
        : tr("origin.share")
    : !t.recurrentTransactionId
      ? tr("origin.oneOff")
      : !item
        ? tr("origin.recurring")
        : date < startOfDay(toDate(item.startDate))
          ? `${tr("origin.earlier")}${item.name !== t.name ? ` · ${item.name}` : ""}`
          : `${tr("origin.cadence", { cadence })}${item.name !== t.name ? ` · ${item.name}` : ""}`;

  // Which stretch the spread payment covers gets its own line: in the
  // joined meta it would be the first thing a phone's ellipsis cuts.
  const covers =
    share && item && t.cycle
      ? tr("origin.covers", {
          from: formatDate(t.cycle.start, "dayYear"),
          to: formatDate(t.cycle.end, "dayYear"),
        })
      : null;

  // Money that left the account: the amount reads negative and the row says
  // why ("Withdrawal", or "Borrowed" on a debt).
  const out = t.direction === "OUT";
  const outLabel = out && isAccountDomain(domain) ? directionLabel(domain, "OUT", language) : null;
  const signed = (value: number) => (out ? -value : value);

  // A row in another currency reads like the totals around it: converted
  // big (the charged amount when it was charged in that currency), the
  // original small underneath. Same currency: one figure, nothing repeated.
  const foreign = t.currency !== ctx.target;
  const charged =
    t.chargedAmount !== undefined && t.chargedCurrency && t.chargedCurrency !== ctx.target
      ? tr("charged", {
          amount: formatNative(signed(t.chargedAmount), t.chargedCurrency, displayCurrency),
        })
      : null;
  const amountMeta = [
    foreign ? formatNative(signed(t.amount), t.currency, displayCurrency) : null,
    charged,
  ]
    .filter(Boolean)
    .join(" · ");

  // One string, not one span per fact: the row reads as a sentence, and the
  // ellipsis lands at the end instead of inside a column.
  const meta = [
    formatDate(date, share ? "month" : "day"),
    category?.name,
    showMethod && method ? paymentMethodLabel(method) : null,
    origin,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ListItem
      leading={
        category ? (
          <IconDisc domain={domain} size={36}>
            <CategoryIcon category={category} size={16} />
          </IconDisc>
        ) : undefined
      }
      name={t.name}
      badges={
        share || hidden.length > 0 || outLabel || labels.length > 0 ? (
          <>
            {share && (
              <Badge variant="outline" tone="info" caps icon={<Repeat size={12} />}>
                {tr("badge.monthlyShare")}
              </Badge>
            )}
            {outLabel && (
              <Badge variant="outline" tone="info" caps>
                {outLabel}
              </Badge>
            )}
            {hidden.map((reason) => (
              <Badge
                key={reason}
                variant="outline"
                tone="warning"
                caps
                icon={reason === "chart" ? <Chart size={12} /> : <Home size={12} />}
              >
                {tc("state.hidden")}
              </Badge>
            ))}
            {labels.map((l) => (
              <Badge key={l} variant="outline">
                {l}
              </Badge>
            ))}
          </>
        ) : undefined
      }
      meta={meta}
      note={covers ?? t.note}
      muted={hidden.includes("chart")}
      amount={
        foreign
          ? formatAmount(convertedAmount(t, ctx), ctx.target)
          : formatNative(signed(t.amount), t.currency, displayCurrency)
      }
      amountMeta={amountMeta || undefined}
      onClick={share && item && onOpenItem ? () => onOpenItem(item) : undefined}
      aria-label={
        share
          ? tr("shareLabel", { name: t.name, item: item?.name ?? tr("shareLabel.theItem") })
          : undefined
      }
      trailing={
        share ? undefined : (
          <KebabMenu
            aria-label={tc("action.actionsFor", { name: t.name })}
            actions={[
              ...(onEdit ? [{ label: tc("action.edit"), onSelect: () => onEdit(t) }] : []),
              {
                label: deleting ? tr("deleting") : tc("action.delete"),
                onSelect: () => t.id && onDelete(t.id),
                danger: true,
                disabled: deleting,
              },
            ]}
          />
        )
      }
    />
  );
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
