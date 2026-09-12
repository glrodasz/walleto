import { useId, useState } from "react";
import { Card } from "../atoms/Card";
import { SectionTitle } from "../atoms/SectionTitle";
import { TextField } from "../atoms/TextField";
import { Select } from "../atoms/Select";
import { Badge } from "../atoms/Badge";
import { CategoryIcon } from "../atoms/CategoryIcon";
import { Chart, Home, Search, Sliders } from "../atoms/Icons";
import { formatNative } from "../atoms/Amount";
import { KebabMenu } from "./KebabMenu";
import { IconDisc } from "./IconDisc";
import { ListItem, ListItems } from "./ListItem";
import { useTransactionFilters } from "../../features/domains/hooks/useTransactionFilters";
import { NO_METHOD } from "../../features/domains/helpers/transactionFilters";
import type { HiddenReason } from "../../helpers/hidden";
import type { TransactionFilters } from "../../features/domains/helpers/transactionFilters";
import { useDateFormat } from "../../hooks/usePreferences";
import { paymentMethodLabel, paymentMethodOptionLabel } from "../../helpers/paymentMethodLabel";
import { tagNames } from "../../helpers/tags";
import { toDate } from "../../helpers/chartData";
import { FREQUENCY_LABELS } from "../../constants";
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
  /**
   * Why a row is hidden — by its recurring item ("dashboard") or by its
   * category ("chart"), or not at all. The row dims either way; the pill says
   * which, since the two are undone in different places.
   */
  hiddenReason?: (transaction: Transaction) => HiddenReason | null;
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
  hiddenReason,
  onDelete,
  deletingId,
  showMethod = true,
  showCategoryFilter = true,
  initialFilters,
  resetKey,
  limit = 60,
}: Props) {
  const filter = useTransactionFilters({
    rows,
    categories,
    tags,
    ctx,
    initial: initialFilters,
    resetKey,
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
              aria-label="Search transactions"
              placeholder="Search transactions…"
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
            Filters
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
              aria-label="Category filter"
              options={[
                { value: "", label: "All categories" },
                ...roots.map((c) => ({ value: c.id!, label: c.name })),
              ]}
              value={filter.filters.categoryId}
              onValueChange={(v) => filter.set("categoryId", v)}
            />
          )}
          {showMethod && (
            <Select
              aria-label="Method filter"
              options={[
                { value: "", label: "All methods" },
                ...methods.map((m) => ({ value: m.id!, label: paymentMethodOptionLabel(m) })),
                { value: NO_METHOD, label: "No method" },
              ]}
              value={filter.filters.paymentMethodId}
              onValueChange={(v) => filter.set("paymentMethodId", v)}
            />
          )}
          <Select
            aria-label="Sort"
            options={SORT_OPTIONS}
            value={`${filter.filters.sort.by}-${filter.filters.sort.dir}`}
            onValueChange={(v) => filter.set("sort", parseSort(v))}
          />
        </div>

        {filter.active && (
          <button type="button" className="clear" onClick={filter.reset}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <p className="empty">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="empty">
          {rows.length === 0 ? "Nothing recorded in this period" : "Nothing matches these filters"}
        </p>
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
              showMethod={showMethod}
              hidden={hiddenReason?.(t) ?? null}
              onEdit={onEdit}
              onDelete={onDelete}
              deleting={deletingId === t.id}
            />
          ))}
        </ListItems>
      )}

      {hidden > 0 && <p className="more">and {hidden} more in this period</p>}

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

const SORT_OPTIONS = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "amount-desc", label: "Largest amount" },
  { value: "amount-asc", label: "Smallest amount" },
];

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
  showMethod: boolean;
  hidden: HiddenReason | null;
  onEdit?: (transaction: Transaction) => void;
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
  showMethod,
  hidden,
  onEdit,
  onDelete,
  deleting,
}: RowProps) {
  const { formatDate } = useDateFormat();
  // "recurring · Monthly", plus the item's name when the row was renamed;
  // a stopped item no longer resolves, so the row just says "recurring".
  const origin = !t.recurrentTransactionId
    ? "one-off"
    : !item
      ? "recurring"
      : `recurring · ${FREQUENCY_LABELS[item.frequency]}${item.name !== t.name ? ` · ${item.name}` : ""}`;

  // One string, not one span per fact: the row reads as a sentence, and the
  // ellipsis lands at the end instead of inside a column.
  const meta = [
    formatDate(toDate(t.occurredAt), "day"),
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
        hidden || labels.length > 0 ? (
          <>
            {hidden && (
              <Badge
                variant="outline"
                tone="warning"
                caps
                icon={hidden === "chart" ? <Chart size={12} /> : <Home size={12} />}
              >
                Hidden
              </Badge>
            )}
            {labels.map((l) => (
              <Badge key={l} variant="outline">
                {l}
              </Badge>
            ))}
          </>
        ) : undefined
      }
      meta={meta}
      note={t.note}
      muted={Boolean(hidden)}
      amount={formatNative(t.amount, t.currency, displayCurrency)}
      amountMeta={
        t.chargedAmount !== undefined && t.chargedCurrency
          ? `charged ${formatNative(t.chargedAmount, t.chargedCurrency, displayCurrency)}`
          : undefined
      }
      trailing={
        <KebabMenu
          aria-label={`Actions for ${t.name}`}
          actions={[
            ...(onEdit ? [{ label: "Edit", onSelect: () => onEdit(t) }] : []),
            {
              label: deleting ? "Deleting…" : "Delete",
              onSelect: () => t.id && onDelete(t.id),
              danger: true,
              disabled: deleting,
            },
          ]}
        />
      }
    />
  );
}
