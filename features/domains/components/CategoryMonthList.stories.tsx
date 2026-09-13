import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { CategoryMonthList } from "./CategoryMonthList";
import { column } from "../../../stories/decorators";
import {
  categoriesFor,
  CURRENT_WINDOW,
  NOW,
  recurrentFor,
  STORY_CTX,
  transactionsFor,
} from "../../../stories/fixtures";

const meta = {
  title: "Organisms/Domains/CategoryMonthList",
  component: CategoryMonthList,
  tags: ["autodocs"],
  args: {
    domain: "EXPENSE",
    categories: categoriesFor("EXPENSE"),
    transactions: transactionsFor("EXPENSE"),
    items: recurrentFor("EXPENSE"),
    ctx: STORY_CTX,
    currency: "USD",
    window: CURRENT_WINDOW,
    now: NOW,
    onSelect: fn(),
    onToggleHidden: fn(),
  },
  decorators: [column],
} satisfies Meta<typeof CategoryMonthList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** This month per root category: paid, still planned, share. Travel is hidden from the chart. */
export const Expenses: Story = {};
export const Incomes: Story = {
  args: {
    domain: "INCOME",
    categories: categoriesFor("INCOME"),
    transactions: transactionsFor("INCOME"),
    items: recurrentFor("INCOME"),
  },
};
export const Loading: Story = { args: { loading: true } };
export const ReadOnly: Story = { args: { onToggleHidden: undefined } };
