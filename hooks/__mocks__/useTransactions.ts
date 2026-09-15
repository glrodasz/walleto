import { fn } from "storybook/test";
import { created, done } from "../../stories/fixtures/hookDefaults";
import type { TransactionInput, TransactionUpdate } from "../../schemas";

export const createTransaction = fn(async (_input: TransactionInput) => created()).mockName(
  "createTransaction"
);
export const deleteTransaction = fn(async (_id: string) => done()).mockName("deleteTransaction");
export const updateTransaction = fn(async (_id: string, _patch: TransactionUpdate) =>
  done()
).mockName("updateTransaction");
