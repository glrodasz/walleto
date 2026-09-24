import type { ReactNode } from "react";
import { fn } from "storybook/test";
import { hookDefaults } from "../../stories/fixtures/hookDefaults";

export type { UserDoc } from "../useUserDoc";
export const useUserDoc = fn(hookDefaults.useUserDoc).mockName("useUserDoc");
export const UserDocProvider = fn(({ children }: { children: ReactNode }) => children).mockName(
  "UserDocProvider"
);
