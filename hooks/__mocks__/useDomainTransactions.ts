import { fn } from "storybook/test";
import { hookDefaults } from "../../stories/fixtures/hookDefaults";

export const useDomainTransactions = fn(hookDefaults.useDomainTransactions).mockName(
  "useDomainTransactions"
);
