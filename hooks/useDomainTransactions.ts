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
