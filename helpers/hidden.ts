import type { Category, RecurrentTransaction } from "../types";

const NONE: ReadonlySet<string> = new Set();

/** Ids of the recurring items the owner hid from the dashboard. */
export function hiddenItemIds(items: Pick<RecurrentTransaction, "id" | "hiddenFromDashboard">[]) {
  return new Set(items.filter((i) => i.id && i.hiddenFromDashboard).map((i) => i.id!));
}

/** Ids of the categories hidden from the domain graph — roots plus their children. */
export function hiddenCategoryIds(
  categories: Pick<Category, "id" | "parentId" | "hiddenFromChart">[]
) {
  const roots = new Set(
    categories.filter((c) => c.id && !c.parentId && c.hiddenFromChart).map((c) => c.id!)
  );
  const ids = new Set(roots);
  for (const c of categories) if (c.id && c.parentId && roots.has(c.parentId)) ids.add(c.id);
  return ids;
}

interface HideableRow {
  recurrentTransactionId?: string;
  categoryId: string;
}

/**
 * A ledger row is hidden through what it belongs to: the recurring item that
 * wrote it, or (on the domain graph) the category it is filed under. One-off
 * rows never hide on their own.
 */
export function isHiddenRow(
  row: HideableRow,
  hiddenItems: ReadonlySet<string>,
  hiddenCategories: ReadonlySet<string> = NONE
): boolean {
  return (
    (row.recurrentTransactionId !== undefined && hiddenItems.has(row.recurrentTransactionId)) ||
    hiddenCategories.has(row.categoryId)
  );
}

export function withoutHidden<T extends HideableRow>(
  rows: T[],
  hiddenItems: ReadonlySet<string>,
  hiddenCategories: ReadonlySet<string> = NONE
): T[] {
  return rows.filter((r) => !isHiddenRow(r, hiddenItems, hiddenCategories));
}
