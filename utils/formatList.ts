/**
 * "A", "A and B", "A, B and C" — an Oxford-comma-free natural-language list.
 * `and` is the conjunction in the reader's language ("y" in Spanish).
 */
export function formatList(items: string[], and = "and"): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} ${and} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;
}
