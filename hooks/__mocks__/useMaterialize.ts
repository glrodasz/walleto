import { fn } from "storybook/test";
import { done, hookDefaults } from "../../stories/fixtures/hookDefaults";

export const materializeNow = fn(async () => done()).mockName("materializeNow");
export const useMaterialize = fn(hookDefaults.useMaterialize).mockName("useMaterialize");
