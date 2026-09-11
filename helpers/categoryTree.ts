import type { Category } from "../types";

/** A root category owns its own id plus every child's. */
export function categoryIdSet(root: Category, categories: Category[]): Set<string> {
  const ids = new Set<string>();
  if (root.id) ids.add(root.id);
  for (const c of categories) if (c.id && c.parentId === root.id) ids.add(c.id);
  return ids;
}

/** child id → root id (a root maps to itself). Folding any row up to its root is one lookup. */
export function rootIdMap(categories: Category[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of categories) if (c.id) map.set(c.id, c.parentId ?? c.id);
  return map;
}

/** The root a category id belongs to, or the id itself when unknown. */
export function rootIdOf(categoryId: string, roots: Map<string, string>): string {
  return roots.get(categoryId) ?? categoryId;
}
