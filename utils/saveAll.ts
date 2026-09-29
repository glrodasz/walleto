/**
 * Runs `save` for every item at once instead of one after another, and waits
 * for all of them before reporting: `onSaved` fires for each one that
 * succeeded (so a caller can lock that row) even when another fails, and the
 * first failure is re-thrown only after everything settled.
 *
 * Resolves to the number saved.
 */
export async function saveAll<T, R>(
  items: T[],
  save: (item: T) => Promise<R>,
  onSaved: (item: T, result: R) => void
): Promise<number> {
  const results = await Promise.allSettled(items.map((item) => save(item)));

  let saved = 0;
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      onSaved(items[i], result.value);
      saved++;
    }
  });

  const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failed) throw failed.reason;
  return saved;
}
