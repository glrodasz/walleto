import { fn } from "storybook/test";
import { hookDefaults } from "../../../../stories/fixtures/hookDefaults";

export const useUpcomingItems = fn(hookDefaults.useUpcomingItems).mockName("useUpcomingItems");
