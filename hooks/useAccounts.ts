import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useUser } from "@auth0/nextjs-auth0/client";
import { db } from "../firebase/client";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { sortAccountsByLabel } from "../helpers/accounts";
import type { Account, AccountDomain } from "../types";
import type { AccountInput, AccountUpdate } from "../schemas";

/** Standalone so a form can create one without subscribing. */
export async function createAccount(input: AccountInput): Promise<string> {
  const res = await fetch("/api/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  const { id } = (await res.json()) as { id: string };
  return id;
}

export async function updateAccount(id: string, patch: AccountUpdate): Promise<void> {
  const res = await fetch(`/api/accounts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function removeAccount(id: string): Promise<void> {
  const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

/**
 * The user's live, non-archived accounts: one domain, every domain ("ALL"),
 * or none at all (`null` skips the subscription — for forms whose domain has
 * no accounts). Equality filters only, sorted by name in memory.
 */
export function useAccounts(domain: AccountDomain | "ALL" | null) {
  const { user } = useUser();
  const { ready } = useFirebaseAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ready || !user?.sub || !domain) return;

    const filters = [where("userId", "==", user.sub), where("archived", "==", false)];
    if (domain !== "ALL") filters.push(where("domain", "==", domain));
    const q = query(collection(db, "accounts"), ...filters);

    return onSnapshot(
      q,
      (snap) => {
        setAccounts(
          sortAccountsByLabel(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Account))
        );
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("useAccounts onSnapshot error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );
  }, [ready, user?.sub, domain]);

  return {
    accounts,
    loading: domain ? loading : false,
    error,
    create: createAccount,
    update: updateAccount,
    remove: removeAccount,
  };
}
