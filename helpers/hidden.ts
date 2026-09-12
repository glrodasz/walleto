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

/** Which rule hid a row — the two are flagged differently in the UI. */
export type HiddenReason = "dashboard" | "chart";

/**
 * A ledger row is hidden through what it belongs to: the recurring item that
 * wrote it (hidden from the dashboard), or the category it is filed under
 * (hidden from the domain graph). One-off rows never hide on their own.
 *
 * A row can match both; the item wins, as it always has — this used to be an
 * `||` that short-circuited on the same term.
 */
export function hiddenRowReason(
  row: HideableRow,
  hiddenItems: ReadonlySet<string>,
  hiddenCategories: ReadonlySet<string> = NONE
): HiddenReason | null {
  if (row.recurrentTransactionId !== undefined && hiddenItems.has(row.recurrentTransactionId)) {
    return "dashboard";
  }
  return hiddenCategories.has(row.categoryId) ? "chart" : null;
}

export function isHiddenRow(
  row: HideableRow,
  hiddenItems: ReadonlySet<string>,
  hiddenCategories: ReadonlySet<string> = NONE
): boolean {
  return hiddenRowReason(row, hiddenItems, hiddenCategories) !== null;
}

export function withoutHidden<T extends HideableRow>(
  rows: T[],
  hiddenItems: ReadonlySet<string>,
  hiddenCategories: ReadonlySet<string> = NONE
): T[] {
  return rows.filter((r) => !isHiddenRow(r, hiddenItems, hiddenCategories));
}
