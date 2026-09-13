import { fn } from "storybook/test";
import { hookDefaults } from "../../stories/fixtures/hookDefaults";

export const usePaymentMethods = fn(hookDefaults.usePaymentMethods).mockName("usePaymentMethods");
