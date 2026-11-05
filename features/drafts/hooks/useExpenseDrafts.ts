import { useMemo } from "react";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { sortDrafts } from "../../../helpers/drafts";
import type { ExpenseDraft } from "../../../types";
import type { ExpenseDraftInput } from "../../../schemas";

export async function createDraft(input: ExpenseDraftInput): Promise<string> {
  const res = await fetch("/api/expense-drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  const { id } = (await res.json()) as { id: string };
  return id;
}

export async function removeDraft(id: string): Promise<void> {
  const res = await fetch(`/api/expense-drafts/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(await res.text());
}

/** The user's drafts, read from the user doc the app already listens to. */
export function useExpenseDrafts(): ExpenseDraft[] {
  const { userDoc } = useUserDoc();
  const drafts = userDoc?.expenseDrafts;
  return useMemo(() => sortDrafts(drafts), [drafts]);
}
