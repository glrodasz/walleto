import { useCallback, useEffect, useRef, useState } from "react";

export interface DraftRow {
  /** Stable React key; independent of the Firestore id. */
  key: string;
  /** Set once the row has been persisted. Rows without one are new. */
  id?: string;
}

let counter = 0;
const nextKey = () => `row-${counter++}`;

/**
 * Repeating-row state for the onboarding steps.
 *
 * Rows hydrate once from whatever is already saved, so returning to a step via
 * Back shows previous input and re-saving does not duplicate it. Hydration is
 * deliberately one-shot: re-running it on every snapshot would clobber whatever
 * the user is typing.
 */
export function useDraftRows<T extends DraftRow>(
  makeEmpty: () => Omit<T, "key">,
  hydrate?: { ready: boolean; rows: Omit<T, "key">[] }
) {
  const blank = useCallback(() => ({ ...makeEmpty(), key: nextKey() }) as T, [makeEmpty]);
  const [rows, setRows] = useState<T[]>(() => [blank()]);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrate?.ready || hydrated.current) return;
    hydrated.current = true;
    if (hydrate.rows.length) {
      setRows(hydrate.rows.map((r) => ({ ...r, key: nextKey() }) as T));
    }
  }, [hydrate?.ready, hydrate?.rows]);

  /** Appends a blank row, optionally pre-filled (e.g. a section's frequency). */
  const add = (overrides: Partial<Omit<T, "key">> = {}) =>
    setRows((prev) => [...prev, { ...blank(), ...overrides }]);

  const update = (key: string, patch: Partial<T>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const removeAt = (key: string) =>
    setRows((prev) => {
      const next = prev.filter((r) => r.key !== key);
      // Never leave the step with zero rows — there'd be nothing to type into.
      return next.length ? next : [blank()];
    });

  /** Back to one blank row — after the rows were persisted and listed elsewhere. */
  const reset = () => setRows([blank()]);

  return { rows, setRows, add, update, removeAt, reset };
}
