import type { Category, RecurrentTransaction } from "../types";

const NONE: ReadonlySet<string> = new Set();

/** Which rule hid something — the two are flagged differently in the UI. */
export type HiddenReason = "dashboard" | "chart";

/**
 * Ids of the recurring items the owner hid from the dashboard, or — with
 * `"chart"` — from their domain page's graph. The two flags are independent.
 */
export function hiddenItemIds(
  items: Pick<RecurrentTransaction, "id" | "hiddenFromDashboard" | "hiddenFromChart">[],
  reason: HiddenReason = "dashboard"
) {
  const flag = reason === "chart" ? "hiddenFromChart" : "hiddenFromDashboard";
  return new Set(items.filter((i) => i.id && i[flag]).map((i) => i.id!));
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

interface HiddenSets {
  /** Items hidden from the dashboard. */
  dashboardItems: ReadonlySet<string>;
  /** Items hidden from their domain graph. */
  chartItems: ReadonlySet<string>;
  /** Categories hidden from their domain graph (roots plus children). */
  chartCategories: ReadonlySet<string>;
}

/**
 * Every rule that hides a ledger row, chart first (the one a domain page acts
 * on). A row hides through what it belongs to: the recurring item that wrote
 * it, or the category it is filed under. One-off rows never hide on their own.
 */
export function hiddenRowReasons(row: HideableRow, sets: HiddenSets): HiddenReason[] {
  const item = row.recurrentTransactionId;
  const reasons: HiddenReason[] = [];
  if (
    (item !== undefined && sets.chartItems.has(item)) ||
    sets.chartCategories.has(row.categoryId)
  ) {
    reasons.push("chart");
  }
  if (item !== undefined && sets.dashboardItems.has(item)) reasons.push("dashboard");
  return reasons;
}

/** Whether a row is out, given the item and category sets that apply where it is drawn. */
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
