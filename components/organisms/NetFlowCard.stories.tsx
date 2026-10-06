import type { Meta, StoryObj } from "@storybook/nextjs";
import { NetFlowCard } from "./NetFlowCard";
import { boxed } from "../../stories/decorators";
import { STORY_FLOW_SUMMARY } from "../../stories/fixtures/flow";

const meta = {
  title: "Organisms/NetFlowCard",
  component: NetFlowCard,
  tags: ["autodocs"],
  args: { flow: STORY_FLOW_SUMMARY, currency: "USD" },
  decorators: [boxed(760)],
} satisfies Meta<typeof NetFlowCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The dashboard hero: the monthly plan and where the income goes. */
export const Default: Story = {};
/** Mixed currencies converted with rates: the figure is marked approximate. */
export const Approximate: Story = { args: { approximate: true } };
/** Only some stats: the onboarding review, before there are investments or debts. */
export const IncomeAndExpenses: Story = { args: { stats: ["income", "expenses"] } };
export const Negative: Story = {
  args: {
    flow: { income: 3000, expenses: 2400, investments: 400, savings: 300, debts: 200, net: -300 },
  },
};
export const Mobile: Story = { globals: { viewport: { value: "mobile1", isRotated: false } } };
