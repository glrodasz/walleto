import type { Meta, StoryObj } from "@storybook/nextjs";
import { UpcomingPayments } from "./UpcomingPayments";
import { boxed } from "../../../stories/decorators";
import { STORY_CATEGORIES, STORY_RECURRENT, upcomingItems } from "../../../stories/fixtures";

const meta = {
  title: "Organisms/Dashboard/UpcomingPayments",
  component: UpcomingPayments,
  tags: ["autodocs"],
  args: { items: upcomingItems(5), categories: STORY_CATEGORIES, displayCurrency: "USD" },
  decorators: [boxed(480)],
} satisfies Meta<typeof UpcomingPayments>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The next five charges, soonest first, in their native currency. */
export const Default: Story = {};
export const Loading: Story = { args: { loading: true, items: [] } };
export const Empty: Story = { args: { items: [] } };
/** A debt payment among the charges: the Debt pill sets it apart from spending. */
export const WithDebtPayment: Story = {
  args: {
    items: [
      ...upcomingItems(3),
      ...STORY_RECURRENT.filter((r) => r.domain === "DEBT" && r.nextOccurrence),
    ],
  },
};
