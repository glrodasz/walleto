import { fn } from "storybook/test";
import { hookDefaults } from "../../stories/fixtures/hookDefaults";

export type { UserDoc } from "../useUserDoc";
export const useUserDoc = fn(hookDefaults.useUserDoc).mockName("useUserDoc");
