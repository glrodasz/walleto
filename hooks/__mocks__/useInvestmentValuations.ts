import { fn } from "storybook/test";
import { created, done, hookDefaults } from "../../stories/fixtures/hookDefaults";
import type { InvestmentValuationInput, InvestmentValuationUpdate } from "../../schemas";

export const createInvestmentValuation = fn(async (_input: InvestmentValuationInput) =>
  created()
).mockName("createInvestmentValuation");
export const updateInvestmentValuation = fn(
  async (_id: string, _patch: InvestmentValuationUpdate) => done()
).mockName("updateInvestmentValuation");
export const removeInvestmentValuation = fn(async (_id: string) => done()).mockName(
  "removeInvestmentValuation"
);
export const useAllInvestmentValuations = fn(hookDefaults.useAllInvestmentValuations).mockName(
  "useAllInvestmentValuations"
);
