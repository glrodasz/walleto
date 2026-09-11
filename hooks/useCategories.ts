import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useUser } from "@auth0/nextjs-auth0/client";
import { db } from "../firebase/client";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { byCreatedAt } from "../utils/sortByCreatedAt";
import type { Category, Domain, IconKey } from "../types";
import type { CategoryUpdate } from "../schemas";

export function useCategories(domain?: Domain) {
  const { user } = useUser();
  const { ready } = useFirebaseAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ready || !user?.sub) return;

    // Sorting happens client-side rather than via orderBy("createdAt"): adding
    // an orderBy on top of these equality filters would need a composite index
    // covering userId + archived + domain + createdAt, and category lists are
    // small enough that sorting here is free.
    const constraints = [
      where("userId", "==", user.sub),
      where("archived", "==", false),
      ...(domain ? [where("domain", "==", domain)] : []),
    ];

    const q = query(collection(db, "categories"), ...constraints);
    return onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category);
        setCategories(docs.sort(byCreatedAt));
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("useCategories onSnapshot error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );
  }, [ready, user?.sub, domain]);

  /** Resolves to the new id so a form can select what it just created. */
  const create = async (input: {
    domain: Domain;
    name: string;
    parentId?: string;
    icon?: IconKey;
  }): Promise<string> => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await res.text());
    const { id } = (await res.json()) as { id: string };
    return id;
  };

  const update = async (id: string, patch: CategoryUpdate) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(await res.text());
  };

  const rename = (id: string, name: string) => update(id, { name });

  const remove = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
  };

  return { categories, loading, error, create, update, rename, remove };
}
