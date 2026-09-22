import { fn } from "storybook/test";
import { done, hookDefaults } from "../../stories/fixtures/hookDefaults";
import type { RecurrentTransactionConvert, RecurrentTransactionUpdate } from "../../schemas";

export const markItemPaid = fn(async (_id: string) => done()).mockName("markItemPaid");
export const updateRecurrentItem = fn(async (_id: string, _patch: RecurrentTransactionUpdate) =>
  done()
).mockName("updateRecurrentItem");
export const useRecurrentTransactions = fn(hookDefaults.useRecurrentTransactions).mockName(
  "useRecurrentTransactions"
);
export const convertItem = fn(async (_id: string, _body: RecurrentTransactionConvert) =>
  done()
).mockName("convertItem");
