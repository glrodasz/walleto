import { fn } from "storybook/test";
import { hookDefaults } from "../../stories/fixtures/hookDefaults";

export const useDomainTransactions = fn(hookDefaults.useDomainTransactions).mockName(
  "useDomainTransactions"
);
export const useSkippedTransactions = fn(hookDefaults.useSkippedTransactions).mockName(
  "useSkippedTransactions"
);
