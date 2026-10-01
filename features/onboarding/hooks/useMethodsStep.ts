import { useMemo, useState } from "react";
import { usePaymentMethods } from "../../../hooks/usePaymentMethods";
import { useDraftRows } from "../../../hooks/useDraftRows";
import type { DraftRow } from "../../../hooks/useDraftRows";
import {
  CARD_TYPES,
  LAST4_ERROR,
  NETWORK_SUGGESTIONS,
  last4Error,
} from "../../../helpers/paymentMethodOptions";
import { UserFacingError } from "../../../utils/errorMessage";
import { saveAll } from "../../../utils/saveAll";
import type { PaymentMethod, PaymentMethodType } from "../../../types";
import type { PaymentMethodUpdate } from "../../../schemas";

export interface MethodRow extends DraftRow {
  type: PaymentMethodType | "";
  network: string;
  last4: string;
  name: string;
}

export const ALIAS_ERROR = "Every payment method needs an alias";

/**
 * Why a row can't be saved as it stands, or null. A new row without a type
 * or an alias isn't an error — it's skipped, as it always was — but a saved
 * one whose alias was cleared can't be, or the edit would vanish.
 */
export function rowProblem(row: MethodRow): string | null {
  if (!row.type) return null;
  if (!row.name.trim()) return row.id ? ALIAS_ERROR : null;
  if (CARD_TYPES.includes(row.type) && last4Error(row.last4)) return LAST4_ERROR;
  return null;
}

/**
 * What changed on a saved row, as a PATCH body, or null when nothing did.
 * The same rules as EditMethodModal: the type never changes, network goes
 * only for types that have one, and last 4 only when it changed — cleared is
 * a null, which the route turns into a field delete.
 */
export function methodPatch(row: MethodRow, method: PaymentMethod): PaymentMethodUpdate | null {
  const patch: PaymentMethodUpdate = {};
  const name = row.name.trim();
  if (name !== method.name) patch.name = name;
  if (NETWORK_SUGGESTIONS[method.type]) {
    const network = row.network.trim();
    if (network !== (method.network ?? "")) patch.network = network;
  }
  if (CARD_TYPES.includes(method.type) && row.last4 !== (method.last4 ?? "")) {
    patch.last4 = row.last4 === "" ? null : row.last4;
  }
  return Object.keys(patch).length ? patch : null;
}

interface Options {
  /**
   * Show the already-saved methods as rows — editable, but with their type
   * locked. The wizard wants that so Back/Next never loses anything; the
   * Methods page has its own list below the form, so hydrating there showed
   * every method twice.
   */
  hydrate?: boolean;
}

export function useMethodsStep({ hydrate = true }: Options = {}) {
  const { methods, loading, create, update, remove } = usePaymentMethods();

  const saved = useMemo(
    () =>
      hydrate
        ? methods.map((m) => ({
            id: m.id,
            type: m.type,
            network: m.network ?? "",
            last4: m.last4 ?? "",
            name: m.name,
          }))
        : [],
    [methods, hydrate]
  );

  const draft = useDraftRows<MethodRow>(() => ({ type: "", network: "", last4: "", name: "" }), {
    ready: !loading,
    rows: saved,
  });

  /**
   * Failed save attempts since the last good one. Every field shows its error
   * once it's non-zero, and each new failure re-opens the first bad row.
   */
  const [attempt, setAttempt] = useState(0);

  /** New rows that would be sent; the rest are saved already or still blank. */
  const pending = () =>
    draft.rows.filter(
      (row): row is MethodRow & { type: PaymentMethodType } =>
        !row.id && Boolean(row.type) && Boolean(row.name.trim())
    );

  /** Saved rows the owner edited here, with what to send for each. */
  const edits = () =>
    draft.rows.flatMap((row) => {
      const method = row.id ? methods.find((m) => m.id === row.id) : undefined;
      const patch = method ? methodPatch(row, method) : null;
      return patch && row.id ? [{ id: row.id, patch }] : [];
    });

  /**
   * Persists rows that don't have an id yet and patches the saved ones that
   * changed; returns the number created.
   * Every row is checked before the first request: rows save one by one, so a
   * bad one in the middle used to leave the ones before it saved and locked.
   * Rows that did save keep their id even if another fails, so a retry
   * doesn't duplicate them.
   */
  const save = async () => {
    const problem = draft.rows.map(rowProblem).find(Boolean);
    if (problem) {
      setAttempt((n) => n + 1);
      throw new UserFacingError(problem);
    }
    setAttempt(0);

    // In parallel: one at a time, each request (and a cold function) added up.
    const [created, patched] = await Promise.allSettled([
      saveAll(
        pending(),
        (row) =>
          create({
            name: row.name.trim(),
            type: row.type,
            ...(row.network.trim() ? { network: row.network.trim() } : {}),
            ...(row.last4 && CARD_TYPES.includes(row.type) ? { last4: row.last4 } : {}),
          }),
        (row, id) => draft.update(row.key, { id })
      ),
      saveAll(
        edits(),
        ({ id, patch }) => update(id, patch),
        () => {}
      ),
    ]);
    if (created.status === "rejected") throw created.reason;
    if (patched.status === "rejected") throw patched.reason;
    return created.value;
  };

  /**
   * Removing only from local state would leave the method in Firestore, so it
   * reappeared as soon as the step re-hydrated from the snapshot on the way back.
   */
  const removeAt = (key: string) => {
    const row = draft.rows.find((r) => r.key === key);
    draft.removeAt(key);
    if (row?.id) {
      remove(row.id).catch((err) => console.error("Failed to delete payment method:", err));
    }
  };

  const reset = () => {
    setAttempt(0);
    draft.reset();
  };

  return { ...draft, reset, removeAt, save, attempt, attempted: attempt > 0 };
}
