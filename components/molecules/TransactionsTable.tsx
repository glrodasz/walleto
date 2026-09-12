import { Card } from "../atoms/Card";
import { SectionTitle } from "../atoms/SectionTitle";
import { TextField } from "../atoms/TextField";
import { Select } from "../atoms/Select";
import { Badge } from "../atoms/Badge";
import { CategoryIcon } from "../atoms/CategoryIcon";
import { Search } from "../atoms/Icons";
import { formatNative } from "../atoms/Amount";
import { KebabMenu } from "./KebabMenu";
import { IconDisc } from "./IconDisc";
import { ListItem, ListItems } from "./ListItem";
import { useTransactionFilters } from "../../features/domains/hooks/useTransactionFilters";
import { NO_METHOD } from "../../features/domains/helpers/transactionFilters";
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
  /** Rows written by a hidden recurring item (or a hidden category) get a pill and dim. */
  isHidden?: (transaction: Transaction) => boolean;
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
  isHidden,
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

  return (
    <Card>
      <SectionTitle title={title} subtitle={subtitle} />

      <div className="toolbar" role="search">
        <div className="search">
          <TextField
            icon={<Search size={16} />}
            aria-label="Search transactions"
            placeholder="Search transactions…"
            value={filter.filters.search}
            onValueChange={(v) => filter.set("search", v)}
          />
        </div>
        {showCategoryFilter && (
          <div className="control">
            <Select
              aria-label="Category filter"
              options={[
                { value: "", label: "All categories" },
                ...roots.map((c) => ({ value: c.id!, label: c.name })),
              ]}
              value={filter.filters.categoryId}
              onValueChange={(v) => filter.set("categoryId", v)}
            />
          </div>
        )}
        {showMethod && (
          <div className="control">
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
          </div>
        )}
        <div className="control">
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
              hidden={Boolean(isHidden?.(t))}
              onEdit={onEdit}
              onDelete={onDelete}
              deleting={deletingId === t.id}
            />
          ))}
        </ListItems>
      )}

      {hidden > 0 && <p className="more">and {hidden} more in this period</p>}

      <style jsx>{`
        .toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .search {
          position: relative;
          flex: 1 1 220px;
          min-width: 180px;
        }

        .control {
          flex: 0 1 190px;
          min-width: 150px;
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
  hidden: boolean;
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
              <Badge variant="outline" tone="warning" caps>
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
      muted={hidden}
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
