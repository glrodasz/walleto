import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useUser } from "@auth0/nextjs-auth0/client";
import { db } from "../firebase/client";
import { useFirebaseAuth } from "./useFirebaseAuth";
import type { Domain, RecurrentTransaction } from "../types";
import type { RecurrentTransactionInput, RecurrentTransactionUpdate } from "../schemas";

export function useRecurrentTransactions(domain?: Domain) {
  const { user } = useUser();
  const { ready } = useFirebaseAuth();
  const [items, setItems] = useState<RecurrentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ready || !user?.sub) return;

    const constraints = [
      where("userId", "==", user.sub),
      where("active", "==", true),
      ...(domain ? [where("domain", "==", domain)] : []),
    ];

    const q = query(collection(db, "recurrentTransactions"), ...constraints);
    return onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RecurrentTransaction));
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("useRecurrentTransactions onSnapshot error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );
  }, [ready, user?.sub, domain]);

  const create = async (input: RecurrentTransactionInput): Promise<string> => {
    const res = await fetch("/api/recurrent-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await res.text());
    const { id } = (await res.json()) as { id: string };
    return id;
  };

  const update = async (id: string, patch: RecurrentTransactionUpdate) => {
    const res = await fetch(`/api/recurrent-transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(await res.text());
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/recurrent-transactions/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
  };

  return { items, loading, error, create, update, remove };
}

/**
 * Pays the item's current nextOccurrence at the materializer's deterministic
 * id and advances the schedule. Standalone: the dashboard's upcoming list
 * and the domain pages' monthly checklist both call it.
 */
export async function markItemPaid(id: string): Promise<void> {
  const res = await fetch(`/api/recurrent-transactions/${id}/mark-paid`, { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
}
