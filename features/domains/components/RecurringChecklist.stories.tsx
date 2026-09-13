import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { RecurringChecklist } from "./RecurringChecklist";
import { column } from "../../../stories/decorators";
import {
  categoriesFor,
  CURRENT_WINDOW,
  NOW,
  recurrentFor,
  STORY_CTX,
  STORY_PAYMENT_METHODS,
  STORY_TAGS,
  transactionsFor,
} from "../../../stories/fixtures";

const meta = {
  title: "Organisms/Domains/RecurringChecklist",
  component: RecurringChecklist,
  tags: ["autodocs"],
  args: {
    domain: "EXPENSE",
    items: recurrentFor("EXPENSE"),
    transactions: transactionsFor("EXPENSE"),
    paymentMethods: STORY_PAYMENT_METHODS,
    categories: categoriesFor("EXPENSE"),
    tags: STORY_TAGS,
    ctx: STORY_CTX,
    currency: "USD",
    window: CURRENT_WINDOW,
    now: NOW,
    onMarkPaid: fn(),
    onEdit: fn(),
    onStop: fn(),
    onToggleHidden: fn(),
    busyId: null,
  },
  decorators: [column],
} satisfies Meta<typeof RecurringChecklist>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every planned charge this month: paid, due or overdue, with the run rate on top. */
export const Expenses: Story = {};
export const Incomes: Story = {
  args: {
    domain: "INCOME",
    items: recurrentFor("INCOME"),
    transactions: transactionsFor("INCOME"),
    categories: categoriesFor("INCOME"),
  },
};
export const Busy: Story = { args: { busyId: "rt-netflix" } };
export const Loading: Story = { args: { loading: true } };
export const Empty: Story = { args: { items: [], transactions: [] } };
