import type { Meta, StoryObj } from "@storybook/nextjs";
import { FlowChart } from "./FlowChart";
import { boxed } from "../../stories/decorators";
import { STORY_FLOW, STORY_PROJECTION } from "../../stories/fixtures";

const meta = {
  title: "Molecules/FlowChart",
  component: FlowChart,
  tags: ["autodocs"],
  args: { data: STORY_FLOW, currency: "USD", loading: false },
  decorators: [boxed(720)],
} satisfies Meta<typeof FlowChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Income against expenses, one point per month. */
export const IncomeVsExpense: Story = {};
/** The Prospect page: current net against the net if items were cancelled. */
export const Projection: Story = {
  args: {
    data: STORY_PROJECTION,
    labelA: "Current",
    labelB: "If cancelled",
    colorA: "var(--fg-2)",
    colorB: "var(--accent)",
    curve: "stepAfter",
  },
};
export const Loading: Story = { args: { loading: true, data: [] } };
export const Empty: Story = { args: { data: [] } };
export const Tall: Story = { args: { height: 360 } };
