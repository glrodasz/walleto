import { useCallback, useEffect, useState } from "react";
import { useUserDoc } from "../../../hooks/useUserDoc";
import type { Currency, EmergencyPlan } from "../../../types";

export function defaultEmergencyPlan(currency: Currency): EmergencyPlan {
  return { currency, benefitMonthly: 0, benefitMonths: 0, severance: 0, includeInvestments: false };
}

/**
 * The owner's emergency income — unemployment benefit, severance — and
 * whether investments count as cash. It lives on the user doc, so the runway
 * reads the same on every visit; until it is set, everything is zero in the
 * owner's display currency.
 *
 * A save shows at once: the draft stands in for the user doc until the
 * listener echoes the write back.
 */
export function useEmergencyPlan() {
  const { userDoc, update } = useUserDoc();
  const saved = userDoc?.emergencyPlan;
  const [draft, setDraft] = useState<EmergencyPlan | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // The echo (or a change from another tab) supersedes the draft.
  useEffect(() => setDraft(null), [saved]);

  const currency = userDoc?.displayCurrency ?? userDoc?.mainCurrency ?? "USD";
  const plan = draft ?? saved ?? defaultEmergencyPlan(currency);

  const save = useCallback(
    async (patch: Partial<EmergencyPlan>) => {
      const next = { ...plan, ...patch };
      setDraft(next);
      setError(null);
      try {
        // Always the whole object: the API merges, and a partial map would
        // leave whatever it omits as it was.
        await update({ emergencyPlan: next });
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [plan, update]
  );

  return { plan, save, error, loading: !userDoc };
}
