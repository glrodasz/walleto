import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { PendingConfirmations } from "./PendingConfirmations";
import { boxed } from "../../../stories/decorators";
import { STORY_CATEGORIES } from "../../../stories/fixtures";
import { monthsAgo, STORY_USER_ID, ts } from "../../../stories/fixtures/time";
import type { Transaction } from "../../../types";

/** A monthly variable bill nobody confirmed for the last seven periods, newest first. */
const rows: Transaction[] = Array.from({ length: 7 }, (_, i) => {
  const date = monthsAgo(i + 2, 28);
  return {
    id: `power_${i}`,
    userId: STORY_USER_ID,
    domain: "EXPENSE",
    categoryId: "cat-expense-home",
    name: "Electricity Bill",
    amount: 1800,
    amountFloor: 900,
    currency: "SEK",
    occurredAt: ts(date),
    status: "PAID",
  } as Transaction;
});

const meta = {
  title: "Organisms/Domains/PendingConfirmations",
  component: PendingConfirmations,
  args: {
    rows,
    categories: STORY_CATEGORIES,
    displayCurrency: "SEK",
    onConfirm: fn(),
    onKeepVariable: fn(),
  },
  decorators: [boxed(760)],
} satisfies Meta<typeof PendingConfirmations>;

export default meta;
type Story = StoryObj<typeof meta>;

/** More periods than the card asks for at once: the newest five, older ones on demand. */
export const ManyPeriods: Story = {};
export const Few: Story = { args: { rows: rows.slice(0, 2) } };
