import { Card } from "../atoms/Card";
import { SectionTitle } from "../atoms/SectionTitle";
import { TextField } from "../atoms/TextField";
import { Select } from "../atoms/Select";
import { Badge } from "../atoms/Badge";
import { CategoryIcon } from "../atoms/CategoryIcon";
import { ArrowDown, ArrowUp, CreditCard, Search } from "../atoms/Icons";
import { formatNative } from "../atoms/Amount";
import { KebabMenu } from "./KebabMenu";
import { IconDisc } from "./IconDisc";
import { useTransactionFilters } from "../../features/domains/hooks/useTransactionFilters";
import { NO_METHOD } from "../../features/domains/helpers/transactionFilters";
import type { SortBy, TransactionFilters } from "../../features/domains/helpers/transactionFilters";
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
  /** Whether the METHOD column and filter make sense for this domain. */
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
 * The ledger as a table: date, description, category, method, amount; with
 * search, filters and a sortable date. Under 768px each row folds into a
 * card, so nothing scrolls sideways on a phone.
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
          <span className="search-icon" aria-hidden="true">
            <Search size={16} />
          </span>
          <TextField
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
        <div className="scroll">
          <table className="table">
            <thead>
              <tr>
                <SortHeader
                  label="Date"
                  by="date"
                  sort={filter.filters.sort}
                  onSort={filter.toggleSort}
                />
                <th scope="col">Description</th>
                <th scope="col">Category</th>
                {showMethod && <th scope="col">Method</th>}
                <SortHeader
                  label="Amount"
                  by="amount"
                  sort={filter.filters.sort}
                  onSort={filter.toggleSort}
                  align="right"
                />
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((t) => (
                <TransactionTableRow
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
            </tbody>
          </table>
        </div>
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

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: inline-flex;
          color: var(--fg-2);
          pointer-events: none;
          z-index: 1;
        }

        .search :global(input) {
          padding-left: 36px;
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

        .scroll {
          overflow-x: auto;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table thead th {
          padding: 0 10px 10px;
          text-align: left;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--fg-2);
          border-bottom: 1px solid var(--line);
          white-space: nowrap;
        }

        .table thead th:first-child {
          padding-left: 0;
        }

        .empty,
        .more {
          margin: 0;
          font-size: 0.8rem;
          color: var(--fg-2);
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
        }

        @media (max-width: 767px) {
          .table thead {
            display: none;
          }

          .table,
          .table tbody {
            display: block;
          }
        }
      `}</style>
    </Card>
  );
}

interface SortHeaderProps {
  label: string;
  by: SortBy;
  sort: TransactionFilters["sort"];
  onSort: (by: SortBy) => void;
  align?: "left" | "right";
}

function SortHeader({ label, by, sort, onSort, align = "left" }: SortHeaderProps) {
  const active = sort.by === by;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={align}
    >
      <button type="button" className="sort" onClick={() => onSort(by)}>
        {label}
        <span className="arrow" aria-hidden="true">
          {active && sort.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
        </span>
      </button>
      <style jsx>{`
        th {
          padding: 0 10px 10px;
          text-align: left;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--fg-2);
          border-bottom: 1px solid var(--line);
          white-space: nowrap;
        }

        th:first-child {
          padding-left: 0;
        }

        th.right {
          text-align: right;
        }

        .sort {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border: none;
          background: transparent;
          font: inherit;
          letter-spacing: inherit;
          text-transform: inherit;
          color: inherit;
          cursor: pointer;
          padding: 0;
        }

        .sort:hover {
          color: var(--fg-0);
        }

        .arrow {
          display: inline-flex;
          opacity: ${active ? 1 : 0.35};
        }
      `}</style>
    </th>
  );
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

/** One ledger row. A component of its own so styled-jsx scopes its styles. */
function TransactionTableRow({
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

  return (
    <tr className={`row${hidden ? " muted" : ""}`}>
      <td className="date">{formatDate(toDate(t.occurredAt), "day")}</td>
      <td className="desc">
        <span className="name">{t.name}</span>
        {(hidden || labels.length > 0) && (
          <span className="pills">
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
          </span>
        )}
        {t.note && <span className="note">{t.note}</span>}
        <span className="origin">{origin}</span>
      </td>
      <td className="category">
        {category ? (
          <span className="cell">
            <IconDisc domain={domain} size={28}>
              <CategoryIcon category={category} size={14} />
            </IconDisc>
            <span>{category.name}</span>
          </span>
        ) : (
          <span className="dim">—</span>
        )}
      </td>
      {showMethod && (
        <td className="method">
          {method ? (
            <span className="cell">
              <span className="method-icon" aria-hidden="true">
                <CreditCard size={16} />
              </span>
              <span>{paymentMethodLabel(method)}</span>
            </span>
          ) : (
            <span className="dim">—</span>
          )}
        </td>
      )}
      <td className="amount">
        <span className="value">{formatNative(t.amount, t.currency, displayCurrency)}</span>
        {t.chargedAmount !== undefined && t.chargedCurrency && (
          <span className="charged">
            charged {formatNative(t.chargedAmount, t.chargedCurrency, displayCurrency)}
          </span>
        )}
      </td>
      <td className="actions">
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
      </td>
      <style jsx>{`
        .row td {
          padding: 12px 10px;
          border-bottom: 1px solid var(--line);
          vertical-align: middle;
          font-size: 0.85rem;
          color: var(--fg-0);
        }

        .row td:first-child {
          padding-left: 0;
        }

        .row td:last-child {
          padding-right: 0;
        }

        .row.muted td {
          opacity: 0.55;
        }

        .date {
          white-space: nowrap;
          color: var(--fg-1);
        }

        .desc {
          min-width: 160px;
        }

        .name {
          display: block;
          font-weight: 500;
        }

        .pills {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 4px;
        }

        .note,
        .origin {
          display: block;
          font-size: 0.72rem;
          color: var(--fg-2);
          margin-top: 2px;
        }

        .cell {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }

        .method-icon {
          display: inline-flex;
          color: var(--fg-2);
        }

        .dim {
          color: var(--fg-2);
        }

        .amount {
          text-align: right;
          white-space: nowrap;
        }

        .value {
          display: block;
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
        }

        .charged {
          display: block;
          font-size: 0.72rem;
          color: var(--fg-2);
        }

        .actions {
          width: 40px;
          text-align: right;
        }

        @media (max-width: 767px) {
          .row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto auto;
            grid-template-areas:
              "desc amount actions"
              "meta meta meta";
            gap: 2px 10px;
            padding: 10px 0;
            border-bottom: 1px solid var(--line);
          }

          .row td {
            display: block;
            padding: 0;
            border-bottom: none;
          }

          .desc {
            grid-area: desc;
            min-width: 0;
          }

          .amount {
            grid-area: amount;
          }

          .actions {
            grid-area: actions;
            width: auto;
          }

          .date,
          .category,
          .method {
            grid-area: meta;
            display: inline;
            font-size: 0.72rem;
            color: var(--fg-2);
          }

          .category::before,
          .method::before {
            content: " · ";
          }

          .cell {
            display: inline;
          }

          .cell :global(.disc),
          .method-icon {
            display: none;
          }
        }
      `}</style>
    </tr>
  );
}
