import { useState } from "react";
import type { DraftRow } from "../../../hooks/useDraftRows";

/**
 * Which item of the payment-method wallet is open — one at a time, the rest
 * collapsed to their faces.
 *
 * - Until the owner picks, the last unsaved row is open: a fresh step starts
 *   with its blank row ready to type into, and a step whose methods are all
 *   saved starts as a closed wallet.
 * - A row added at the end opens (and closes the one that was open).
 * - Each failed save (`attempt` going up) opens the first row with a problem,
 *   so the error is never hidden inside a collapsed face.
 *
 * The "previous render" values live in state and are compared while
 * rendering, so a new row opens in the same paint it appears in.
 */
export function useOpenRow(rows: DraftRow[], invalidKey: string | null, attempt: number) {
  // undefined: nobody picked yet, the default applies; null: all closed.
  const [chosen, setChosen] = useState<string | null | undefined>(undefined);
  const [seenLength, setSeenLength] = useState(rows.length);
  const [seenAttempt, setSeenAttempt] = useState(attempt);

  if (rows.length !== seenLength) {
    setSeenLength(rows.length);
    const last = rows[rows.length - 1];
    // Hydration also grows the list, but with saved rows: those stay closed.
    if (rows.length > seenLength && last && !last.id) setChosen(last.key);
  }

  if (attempt !== seenAttempt) {
    setSeenAttempt(attempt);
    if (attempt > 0 && invalidKey) setChosen(invalidKey);
  }

  const fallback = [...rows].reverse().find((row) => !row.id)?.key ?? null;
  // A chosen row that was removed falls back to the default.
  const openKey =
    chosen === null ? null : chosen && rows.some((r) => r.key === chosen) ? chosen : fallback;

  return {
    openKey,
    toggle: (key: string) => setChosen(openKey === key ? null : key),
    close: () => setChosen(null),
  };
}
