import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useUser } from "@auth0/nextjs-auth0/client";
import { db } from "../firebase/client";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { sortTagsByName } from "../helpers/tags";
import type { Tag } from "../types";
import type { TagUpdate } from "../schemas";

/** Resolves to the tag's id (an archived tag with the same key is revived). */
export async function createTag(name: string): Promise<string> {
  const res = await fetch("/api/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await res.text());
  const { id } = (await res.json()) as { id: string };
  return id;
}

export async function updateTag(id: string, patch: TagUpdate): Promise<void> {
  const res = await fetch(`/api/tags/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function removeTag(id: string): Promise<void> {
  const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

/**
 * The user's live tags, sorted by name in memory. Equality filters only, so
 * no composite index. Rows store tag ids; components resolve names through
 * this list (`helpers/tags` `tagNames`).
 */
export function useTags() {
  const { user } = useUser();
  const { ready } = useFirebaseAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ready || !user?.sub) return;

    const q = query(
      collection(db, "tags"),
      where("userId", "==", user.sub),
      where("archived", "==", false)
    );

    return onSnapshot(
      q,
      (snap) => {
        setTags(sortTagsByName(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Tag)));
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("useTags onSnapshot error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );
  }, [ready, user?.sub]);

  return { tags, loading, error, create: createTag, update: updateTag, remove: removeTag };
}
