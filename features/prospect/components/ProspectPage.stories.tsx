import type { Meta, StoryObj } from "@storybook/nextjs";
import { mocked } from "storybook/test";
import { ProspectPage } from "./ProspectPage";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { STORY_USER_DOC } from "../../../stories/fixtures";
import { hookDefaults, loadingState } from "../../../stories/fixtures/hookDefaults";
import { at, MOBILE, screen } from "../../../stories/templates";

/** The plan simulator: what-if cancellations, and the emergency-mode runway. */
const meta = {
  title: "Templates/Prospect",
  component: ProspectPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", ...at("/prospect") },
  decorators: [screen],
} satisfies Meta<typeof ProspectPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** Emergency mode with the demo profile's benefit and severance. */
export const Emergency: Story = { args: { initialMode: "emergency" } };
/** Emergency mode with no fallback income at all. */
export const EmergencyNoBenefit: Story = {
  args: { initialMode: "emergency" },
  beforeEach: () => {
    mocked(useUserDoc).mockImplementation(() => ({
      ...hookDefaults.useUserDoc(),
      userDoc: { ...STORY_USER_DOC, emergencyPlan: undefined },
    }));
  },
};
export const Loading: Story = {
  beforeEach: () => {
    mocked(useRecurrentTransactions).mockImplementation((d) => ({
      ...hookDefaults.useRecurrentTransactions(d),
      items: [],
      ...loadingState,
    }));
  },
};
export const Mobile: Story = { globals: MOBILE };
export const EmergencyMobile: Story = { args: { initialMode: "emergency" }, globals: MOBILE };
