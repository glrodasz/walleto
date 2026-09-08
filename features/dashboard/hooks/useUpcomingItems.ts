import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useUser } from "@auth0/nextjs-auth0/client";
import { db } from "../../../firebase/client";
import { useFirebaseAuth } from "../../../hooks/useFirebaseAuth";
import { markItemPaid } from "../../../hooks/useRecurrentTransactions";
import type { RecurrentTransaction } from "../../../types";

/** Soonest first; items without a next charge sink to the bottom. */
function byNextOccurrence(a: RecurrentTransaction, b: RecurrentTransaction) {
  const at = a.nextOccurrence?.toDate().getTime() ?? Infinity;
  const bt = b.nextOccurrence?.toDate().getTime() ?? Infinity;
  return at - bt;
}

export function useUpcomingItems(count: number = 5) {
  const { user } = useUser();
  const { ready } = useFirebaseAuth();
  const [items, setItems] = useState<RecurrentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ready || !user?.sub) return;

    // Equality filters only, then window/sort/slice in memory. Adding
    // `nextOccurrence > now` + orderBy would need a composite index, and a
    // user only ever has a few dozen active items — the same trade-off
    // useCategories already makes. One less thing that breaks on a fresh
    // project where the indexes haven't been deployed.
    const q = query(
      collection(db, "recurrentTransactions"),
      where("userId", "==", user.sub),
      where("active", "==", true)
    );

    return onSnapshot(
      q,
      (snap) => {
        const now = Date.now();
        const upcoming = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as RecurrentTransaction)
          .filter((i) => (i.nextOccurrence?.toDate().getTime() ?? 0) > now)
          .sort(byNextOccurrence)
          .slice(0, count);

        setItems(upcoming);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("useUpcomingItems onSnapshot error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );
  }, [ready, user?.sub, count]);

  return { items, loading, error, markPaid: markItemPaid };
}
