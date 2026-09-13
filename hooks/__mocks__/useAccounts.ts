import { fn } from "storybook/test";
import { created, done, hookDefaults } from "../../stories/fixtures/hookDefaults";
import type { AccountInput, AccountUpdate } from "../../schemas";

export const createAccount = fn(async (_input: AccountInput) => created()).mockName(
  "createAccount"
);
export const updateAccount = fn(async (_id: string, _patch: AccountUpdate) => done()).mockName(
  "updateAccount"
);
export const removeAccount = fn(async (_id: string) => done()).mockName("removeAccount");
export const useAccounts = fn(hookDefaults.useAccounts).mockName("useAccounts");
