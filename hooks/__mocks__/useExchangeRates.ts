import { fn } from "storybook/test";
import { hookDefaults } from "../../stories/fixtures/hookDefaults";

export const useExchangeRates = fn(hookDefaults.useExchangeRates).mockName("useExchangeRates");
