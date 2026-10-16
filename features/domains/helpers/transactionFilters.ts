import { convertedAmount } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { categoryIdSet } from "../../../helpers/categoryTree";
import { toDate } from "../../../helpers/chartData";
import { tagNames } from "../../../helpers/tags";
import type { Category, Tag, Transaction } from "../../../types";

export type SortBy = "date" | "amount";
export type SortDir = "asc" | "desc";

export interface TransactionFilters {
  /** Case-insensitive, matched against name, note and tag names. */
  search: string;
  /** A root category id; its children match too. "" = all. */
  categoryId: string;
  /** "" = all; "__none" = rows without a method. */
  paymentMethodId: string;
  sort: { by: SortBy; dir: SortDir };
}

export const NO_METHOD = "__none";

export const EMPTY_FILTERS: TransactionFilters = {
  search: "",
  categoryId: "",
  paymentMethodId: "",
  sort: { by: "date", dir: "desc" },
};

interface Lookups {
  categories: Category[];
  tags: Tag[];
  ctx: MoneyContext;
}

/** The table's rows: searched, narrowed and sorted. Pure, so the view is testable. */
export function filterTransactions(
  rows: Transaction[],
  filters: TransactionFilters,
  { categories, tags, ctx }: Lookups
): Transaction[] {
  const needle = filters.search.trim().toLowerCase();
  const root = filters.categoryId ? categories.find((c) => c.id === filters.categoryId) : null;
  const categoryIds = root ? categoryIdSet(root, categories) : null;

  const kept = rows.filter((t) => {
    if (categoryIds && !categoryIds.has(t.categoryId)) return false;
    if (filters.paymentMethodId === NO_METHOD && t.paymentMethodId) return false;
    if (
      filters.paymentMethodId &&
      filters.paymentMethodId !== NO_METHOD &&
      t.paymentMethodId !== filters.paymentMethodId
    ) {
      return false;
    }
    if (!needle) return true;
    const haystack = [t.name, t.note ?? "", ...tagNames(t.tags, tags)].join(" ").toLowerCase();
    return haystack.includes(needle);
  });

  const sign = filters.sort.dir === "asc" ? 1 : -1;
  return kept.sort((a, b) => {
    const diff =
      filters.sort.by === "amount"
        ? Math.abs(convertedAmount(a, ctx)) - Math.abs(convertedAmount(b, ctx))
        : toDate(a.occurredAt).getTime() - toDate(b.occurredAt).getTime();
    return diff * sign;
  });
}

/** The query keys the Activity filters use, so the month picker can keep them. */
export const FILTER_QUERY_KEYS = ["q", "category", "method", "sort"] as const;
type FilterQueryKey = (typeof FILTER_QUERY_KEYS)[number];
const SORTS = ["date-desc", "date-asc", "amount-desc", "amount-asc"];

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Filters from a URL query; unknown or malformed values fall back to the defaults. */
export function filtersFromQuery(
  query: Record<string, string | string[] | undefined>
): TransactionFilters {
  const sort = first(query.sort);
  const [by, dir] = sort && SORTS.includes(sort) ? sort.split("-") : [];
  return {
    search: first(query.q) ?? "",
    categoryId: first(query.category) ?? "",
    paymentMethodId: first(query.method) ?? "",
    sort: by ? { by: by as SortBy, dir: dir as SortDir } : EMPTY_FILTERS.sort,
  };
}

/** The query that describes `filters`: only what differs from the defaults. */
export function filtersToQuery(
  filters: TransactionFilters
): Partial<Record<FilterQueryKey, string>> {
  const query: Partial<Record<FilterQueryKey, string>> = {};
  if (filters.search) query.q = filters.search;
  if (filters.categoryId) query.category = filters.categoryId;
  if (filters.paymentMethodId) query.method = filters.paymentMethodId;
  const { by, dir } = filters.sort;
  if (by !== EMPTY_FILTERS.sort.by || dir !== EMPTY_FILTERS.sort.dir) query.sort = `${by}-${dir}`;
  return query;
}
