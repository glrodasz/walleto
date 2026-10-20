import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy, Timestamp } from "firebase/firestore";
import { useUser } from "@auth0/nextjs-auth0/client";
import { db } from "../firebase/client";
import { useFirebaseAuth } from "./useFirebaseAuth";
import type { Domain, Transaction } from "../types";

export function useDomainTransactions(domain: Domain, startDate: Date) {
  const { user } = useUser();
  const { ready } = useFirebaseAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ready || !user?.sub) return;

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.sub),
      where("domain", "==", domain),
      where("status", "==", "PAID"),
      where("occurredAt", ">=", Timestamp.fromDate(startDate)),
      orderBy("occurredAt", "asc")
    );

    return onSnapshot(
      q,
      (snap) => {
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction));
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("useDomainTransactions onSnapshot error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );
  }, [ready, user?.sub, domain, startDate.getTime()]);

  return { transactions, loading, error };
}

/**
 * The month's SKIPPED rows: payments removed from Activity. Only the Plan
 * reads them, to tell an occurrence that didn't happen from an overdue one.
 * Same composite index as the PAID query (status is an equality filter).
 */
export function useSkippedTransactions(domain: Domain, start: Date, end: Date, enabled = true) {
  const { user } = useUser();
  const { ready } = useFirebaseAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!enabled || !ready || !user?.sub) return;

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.sub),
      where("domain", "==", domain),
      where("status", "==", "SKIPPED"),
      where("occurredAt", ">=", Timestamp.fromDate(start)),
      where("occurredAt", "<", Timestamp.fromDate(end)),
      orderBy("occurredAt", "asc")
    );

    return onSnapshot(
      q,
      (snap) => setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction)),
      // Without them a removed occurrence reads as overdue, as it did before.
      (err) => console.error("useSkippedTransactions onSnapshot error:", err)
    );
  }, [enabled, ready, user?.sub, domain, start.getTime(), end.getTime()]);

  return { transactions: enabled ? transactions : [] };
}
