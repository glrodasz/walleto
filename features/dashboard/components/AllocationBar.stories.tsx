import type { Meta, StoryObj } from "@storybook/nextjs";
import { AllocationBar } from "./AllocationBar";
import { boxed } from "../../../stories/decorators";
import { STORY_FLOW_SUMMARY } from "../../../stories/fixtures/flow";

const meta = {
  title: "Organisms/Dashboard/AllocationBar",
  component: AllocationBar,
  tags: ["autodocs"],
  args: { flow: STORY_FLOW_SUMMARY },
  decorators: [boxed(560)],
} satisfies Meta<typeof AllocationBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** How the month's income splits into expenses, investments, savings and what is left. */
export const Default: Story = {};
export const Overspent: Story = {
  args: { flow: { income: 3000, expenses: 2600, investments: 400, savings: 300, net: -300 } },
};
export const NothingAllocated: Story = {
  args: { flow: { income: 3000, expenses: 0, investments: 0, savings: 0, net: 3000 } },
};
