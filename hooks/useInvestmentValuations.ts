import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useUser } from "@auth0/nextjs-auth0/client";
import { db } from "../firebase/client";
import { useFirebaseAuth } from "./useFirebaseAuth";
import type { InvestmentValuation } from "../types";
import type { InvestmentValuationInput, InvestmentValuationUpdate } from "../schemas";

/** Standalone so the create modal can record one without subscribing. */
export async function createInvestmentValuation(input: InvestmentValuationInput): Promise<string> {
  const res = await fetch("/api/investment-valuations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  const { id } = (await res.json()) as { id: string };
  return id;
}

/** Newest first. */
function byAsOfDesc(a: InvestmentValuation, b: InvestmentValuation) {
  return b.asOf.toDate().getTime() - a.asOf.toDate().getTime();
}

export async function updateInvestmentValuation(
  id: string,
  patch: InvestmentValuationUpdate
): Promise<void> {
  const res = await fetch(`/api/investment-valuations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function removeInvestmentValuation(id: string): Promise<void> {
  const res = await fetch(`/api/investment-valuations/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

/**
 * Every valuation of the user, all accounts and both buckets — a handful a
 * year, so one listener serves the Value view, its panels, the record modal
 * and the month ledger, and selectors match in memory (which is also the
 * only way to catch pre-account valuations, which carry no `domain`).
 * Equality filter only, newest first.
 */
export function useAllInvestmentValuations() {
  const { user } = useUser();
  const { ready } = useFirebaseAuth();
  const [valuations, setValuations] = useState<InvestmentValuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ready || !user?.sub) return;
    const q = query(collection(db, "investmentValuations"), where("userId", "==", user.sub));
    return onSnapshot(
      q,
      (snap) => {
        setValuations(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InvestmentValuation).sort(byAsOfDesc)
        );
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("useAllInvestmentValuations onSnapshot error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );
  }, [ready, user?.sub]);

  return { valuations, loading, error };
}
