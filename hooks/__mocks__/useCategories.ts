import { fn } from "storybook/test";
import { hookDefaults } from "../../stories/fixtures/hookDefaults";

export const useCategories = fn(hookDefaults.useCategories).mockName("useCategories");
