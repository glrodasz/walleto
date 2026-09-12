import { useEffect, useMemo, useState } from "react";
import { EMPTY_FILTERS, filterTransactions } from "../helpers/transactionFilters";
import type { SortBy, TransactionFilters } from "../helpers/transactionFilters";
import type { MoneyContext } from "../../../helpers/aggregations";
import type { Category, Tag, Transaction } from "../../../types";

interface Args {
  rows: Transaction[];
  categories: Category[];
  tags: Tag[];
  ctx: MoneyContext;
  /** Starting filters; changing them (a drilldown from another view) resets the state. */
  initial?: Partial<TransactionFilters>;
  /** Anything that should clear the filters when it changes (the selected month). */
  resetKey?: string;
}

/** Search, narrow and sort the month's rows; the pure work is in helpers/transactionFilters. */
export function useTransactionFilters({ rows, categories, tags, ctx, initial, resetKey }: Args) {
  const [filters, setFilters] = useState<TransactionFilters>({ ...EMPTY_FILTERS, ...initial });

  useEffect(() => {
    setFilters({ ...EMPTY_FILTERS, ...initial });
    // `initial` is an object literal from the parent; its fields are what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, initial?.categoryId, initial?.paymentMethodId, initial?.search]);

  const set = <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const toggleSort = (by: SortBy) =>
    setFilters((f) => ({
      ...f,
      sort: { by, dir: f.sort.by === by && f.sort.dir === "desc" ? "asc" : "desc" },
    }));

  const filtered = useMemo(
    () => filterTransactions(rows, filters, { categories, tags, ctx }),
    [rows, filters, categories, tags, ctx]
  );

  const active =
    filters.search.trim() !== "" || filters.categoryId !== "" || filters.paymentMethodId !== "";

  // How many of the *narrowing* controls are set — not the search, which is on
  // screen anyway, and not the sort, which narrows nothing. It is what the
  // Filters button counts when the panel is collapsed on a phone.
  const narrowCount = (filters.categoryId ? 1 : 0) + (filters.paymentMethodId ? 1 : 0);

  return {
    filters,
    set,
    toggleSort,
    reset: () => setFilters(EMPTY_FILTERS),
    rows: filtered,
    active,
    narrowCount,
  };
}
