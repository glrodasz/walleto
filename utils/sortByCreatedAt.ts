/**
 * Shape of anything carrying a Firestore-style timestamp. Structural on
 * purpose: keeping this module free of domain imports is what makes it a util
 * rather than a helper.
 */
type HasCreatedAt = { createdAt?: { seconds?: number } | null };

/**
 * Sort key for a document's creation time.
 *
 * `createdAt` is written with serverTimestamp(), which reads back as null on
 * the local echo before the server resolves it. Those pending writes sort last
 * so a freshly added row appends to the list instead of jumping to the top.
 */
export function createdAtMillis(doc: HasCreatedAt): number {
  const seconds = doc.createdAt?.seconds;
  return typeof seconds === "number" ? seconds * 1000 : Number.MAX_SAFE_INTEGER;
}

export function byCreatedAt(a: HasCreatedAt, b: HasCreatedAt): number {
  return createdAtMillis(a) - createdAtMillis(b);
}
