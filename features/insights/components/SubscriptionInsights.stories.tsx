import type { Meta, StoryObj } from "@storybook/nextjs";
import { SubscriptionInsights } from "./SubscriptionInsights";
import { column } from "../../../stories/decorators";
import { categoriesFor, recurrentFor, STORY_CTX } from "../../../stories/fixtures";

const meta = {
  title: "Organisms/Insights/SubscriptionInsights",
  component: SubscriptionInsights,
  tags: ["autodocs"],
  args: {
    items: recurrentFor("EXPENSE"),
    categories: categoriesFor("EXPENSE"),
    ctx: STORY_CTX,
    currency: "USD",
  },
  decorators: [column],
} satisfies Meta<typeof SubscriptionInsights>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Monthly and annualised subscription cost, as a share of income (from the mocked incomes). */
export const Default: Story = {};
export const NoSubscriptions: Story = {
  args: { items: recurrentFor("EXPENSE").filter((i) => i.type !== "SUBSCRIPTION") },
};
