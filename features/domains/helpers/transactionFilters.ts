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
        ? convertedAmount(a, ctx) - convertedAmount(b, ctx)
        : toDate(a.occurredAt).getTime() - toDate(b.occurredAt).getTime();
    return diff * sign;
  });
}
