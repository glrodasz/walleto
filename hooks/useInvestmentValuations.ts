import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useUser } from "@auth0/nextjs-auth0/client";
import { db } from "../firebase/client";
import { useFirebaseAuth } from "./useFirebaseAuth";
import type { InvestmentValuation } from "../types";
import type { InvestmentValuationInput, InvestmentValuationUpdate } from "../schemas";
import type { ValueSelector } from "../features/investments/helpers/valuation";

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

/**
 * One account's (or, for pre-account entries, one category's) valuation
 * history. Equality filters only, sorted in memory — a position accrues a
 * handful of valuations a year, and this way the query needs no composite
 * index.
 */
export function useInvestmentValuations(selector: ValueSelector | null) {
  const field = selector && "accountId" in selector ? "accountId" : "categoryId";
  const id = selector ? ("accountId" in selector ? selector.accountId : selector.categoryId) : null;
  const { user } = useUser();
  const { ready } = useFirebaseAuth();
  const [valuations, setValuations] = useState<InvestmentValuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ready || !user?.sub || !id) return;

    const q = query(
      collection(db, "investmentValuations"),
      where("userId", "==", user.sub),
      where(field, "==", id)
    );

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
        console.error("useInvestmentValuations onSnapshot error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );
  }, [ready, user?.sub, field, id]);

  const update = async (id: string, patch: InvestmentValuationUpdate) => {
    const res = await fetch(`/api/investment-valuations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(await res.text());
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/investment-valuations/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
  };

  return { valuations, loading, error, create: createInvestmentValuation, update, remove };
}

/**
 * Every valuation of the user, all categories — the Investments page's Value
 * view and its month ledger need them side by side. Equality filter only,
 * newest first in memory.
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
