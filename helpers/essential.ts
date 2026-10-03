import type { Category, RecurrentTransaction } from "../types";

type CategoryName = Pick<Category, "id" | "name">;

function categoryName(categoryId: string, categories: CategoryName[]): string | undefined {
  return categories
    .find((c) => c.id === categoryId)
    ?.name.trim()
    .toLowerCase();
}

/**
 * A recurrent item counts as a subscription if it's explicitly typed as one,
 * or its category is the "Subscriptions" default — the wizard's quick-add
 * flow leaves `type` unset (falls to OTHER), so category is the fallback
 * signal rather than a hard requirement.
 */
export function isSubscription(
  item: Pick<RecurrentTransaction, "type" | "categoryId">,
  categories: CategoryName[]
): boolean {
  if (item.type === "SUBSCRIPTION") return true;
  return categoryName(item.categoryId, categories) === "subscriptions";
}

/** Default category names whose items are, by nature, the first to go. */
const DISPENSABLE_CATEGORIES = new Set(["subscriptions", "variable"]);

/**
 * Whether a plan item survives emergency mode. The owner's own flag wins;
 * without one it is guessed:
 *
 * - DEBT payments are always essential — a missed repayment costs more than
 *   it saves, so they are never paused.
 * - INVESTMENT and SAVING are contributions, never essential: emergency mode
 *   stops them first.
 * - An EXPENSE is dispensable when it is a subscription or sits under the
 *   "Variable" default. Anything else is kept: an unknown expense guessed as
 *   essential under-states the runway, which is the safe way to be wrong.
 * - INCOME isn't spending, so the question doesn't apply.
 */
export function isEssential(
  item: Pick<RecurrentTransaction, "domain" | "type" | "categoryId" | "essential">,
  categories: CategoryName[]
): boolean {
  if (item.domain === "DEBT") return true;
  if (item.domain !== "EXPENSE") return false;
  if (item.essential !== undefined) return item.essential;
  if (isSubscription(item, categories)) return false;
  return !DISPENSABLE_CATEGORIES.has(categoryName(item.categoryId, categories) ?? "");
}

/** True while the owner hasn't said — the UI marks the guess as one. */
export function essentialIsGuessed(
  item: Pick<RecurrentTransaction, "domain" | "essential">
): boolean {
  return item.domain === "EXPENSE" && item.essential === undefined;
}
