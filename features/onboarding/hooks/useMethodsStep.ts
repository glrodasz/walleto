import { useMemo, useState } from "react";
import { usePaymentMethods } from "../../../hooks/usePaymentMethods";
import { useDraftRows } from "../../../hooks/useDraftRows";
import type { DraftRow } from "../../../hooks/useDraftRows";
import { CARD_TYPES, LAST4_ERROR, last4Error } from "../../../helpers/paymentMethodOptions";
import { UserFacingError } from "../../../utils/errorMessage";
import type { PaymentMethodType } from "../../../types";

export interface MethodRow extends DraftRow {
  type: PaymentMethodType | "";
  network: string;
  last4: string;
  name: string;
}

interface Options {
  /**
   * Show the already-saved methods as (locked) rows. The wizard wants that so
   * Back/Next never loses anything; the Methods page has its own list below
   * the form, so hydrating there showed every method twice.
   */
  hydrate?: boolean;
}

export function useMethodsStep({ hydrate = true }: Options = {}) {
  const { methods, loading, create, remove } = usePaymentMethods();

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

  /** Set by a save that found a bad row, so every field shows its error at once. */
  const [attempted, setAttempted] = useState(false);

  /** New rows that would be sent; the rest are saved already or still blank. */
  const pending = () =>
    draft.rows.filter(
      (row): row is MethodRow & { type: PaymentMethodType } =>
        !row.id && Boolean(row.type) && Boolean(row.name.trim())
    );

  /**
   * Persists rows that don't have an id yet; returns the number created.
   * Every row is checked before the first POST: rows save one by one, so a
   * bad one in the middle used to leave the ones before it saved and locked.
   */
  const save = async () => {
    const rows = pending();
    if (rows.some((row) => CARD_TYPES.includes(row.type) && last4Error(row.last4))) {
      setAttempted(true);
      throw new UserFacingError(LAST4_ERROR);
    }
    setAttempted(false);

    let created = 0;
    for (const row of rows) {
      const id = await create({
        name: row.name.trim(),
        type: row.type,
        ...(row.network.trim() ? { network: row.network.trim() } : {}),
        ...(row.last4 && CARD_TYPES.includes(row.type) ? { last4: row.last4 } : {}),
      });
      draft.update(row.key, { id });
      created++;
    }
    return created;
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
    setAttempted(false);
    draft.reset();
  };

  return { ...draft, reset, removeAt, save, attempted };
}
