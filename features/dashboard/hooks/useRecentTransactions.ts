import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import { useUser } from "@auth0/nextjs-auth0/client";
import { db } from "../../../firebase/client";
import { useFirebaseAuth } from "../../../hooks/useFirebaseAuth";
import type { Transaction } from "../../../types";

export function useRecentTransactions(count: number = 10) {
  const { user } = useUser();
  const { ready } = useFirebaseAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ready || !user?.sub) return;

    // Over-fetch so rows hidden from the dashboard can be dropped in memory
    // and the list still shows `count`: a third filter would need a new index.
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.sub),
      where("status", "==", "PAID"),
      orderBy("occurredAt", "desc"),
      limit(count * 3)
    );

    return onSnapshot(
      q,
      (snap) => {
        setTransactions(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Transaction)
            .filter((t) => !t.hiddenFromDashboard)
            .slice(0, count)
        );
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("useRecentTransactions onSnapshot error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );
  }, [ready, user?.sub, count]);

  return { transactions, loading, error };
}
