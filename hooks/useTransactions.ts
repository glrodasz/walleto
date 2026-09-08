import type { TransactionInput, TransactionUpdate } from "../schemas";

/**
 * Write path for one-off transactions. Standalone functions, like
 * createInvestmentValuation: the forms that call them never need a listener,
 * every page already subscribes to the transactions it displays.
 */
export async function createTransaction(input: TransactionInput): Promise<string> {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  const { id } = (await res.json()) as { id: string };
  return id;
}

/** Soft delete: the API marks the transaction SKIPPED, so every aggregate drops it. */
export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

/** Partial update; the API validates category ownership and the charged pair. */
export async function updateTransaction(id: string, patch: TransactionUpdate): Promise<void> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await res.text());
}
