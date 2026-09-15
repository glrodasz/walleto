import { fn } from "storybook/test";
import { hookDefaults } from "../../stories/fixtures/hookDefaults";

export const useFirebaseAuth = fn(hookDefaults.useFirebaseAuth).mockName("useFirebaseAuth");
