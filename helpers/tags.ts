import type { Tag } from "../types";

export const MAX_TAG_LENGTH = 30;

/** Display form: trimmed, inner whitespace removed, case kept ("Trip 2026" → "Trip2026"). */
export function normaliseTagName(raw: string): string {
  return raw.trim().replace(/\s+/g, "");
}

/** Uniqueness key per user: the display form lowercased. */
export function tagKey(raw: string): string {
  return normaliseTagName(raw).toLowerCase();
}

/** Names for a row's tag ids, in the row's order; unknown (archived) ids drop out. */
export function tagNames(ids: string[] | undefined, tags: Pick<Tag, "id" | "name">[]): string[] {
  if (!ids?.length) return [];
  const byId = new Map(tags.map((t) => [t.id, t.name]));
  return ids.map((id) => byId.get(id)).filter((n): n is string => Boolean(n));
}

/** Locale-aware, case-insensitive; returns a new array. */
export function sortTagsByName<T extends { name: string }>(tags: T[]): T[] {
  return [...tags].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}
