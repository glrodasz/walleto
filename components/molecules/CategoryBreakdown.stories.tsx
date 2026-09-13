import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { boxed } from "../../stories/decorators";
import { STORY_CATEGORIES } from "../../stories/fixtures";

const ROWS = [
  { categoryId: "cat-expense-home", name: "Home & Family", amount: 1650, percent: 52 },
  { categoryId: "cat-expense-variable", name: "Variable", amount: 640, percent: 20 },
  { categoryId: "cat-expense-credits", name: "Credits", amount: 320, percent: 10 },
  { categoryId: "cat-expense-insurance", name: "Insurances", amount: 120, percent: 4 },
  { categoryId: "cat-expense-subs", name: "Subscriptions", amount: 40, percent: 1.3 },
  { categoryId: "__other", name: "Other", amount: 400, percent: 12.7 },
];

const meta = {
  title: "Molecules/CategoryBreakdown",
  component: CategoryBreakdown,
  tags: ["autodocs"],
  args: {
    title: "Top expense categories",
    rows: ROWS,
    categories: STORY_CATEGORIES,
    domain: "EXPENSE",
    currency: "USD",
    href: "/expenses",
  },
  decorators: [boxed(520)],
} satisfies Meta<typeof CategoryBreakdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expenses: Story = {};
export const Income: Story = {
  args: {
    title: "Income sources",
    domain: "INCOME",
    href: undefined,
    onViewAll: fn(),
    rows: [
      { categoryId: "cat-income-salary", name: "Salary", amount: 4800, percent: 71 },
      { categoryId: "cat-income-side", name: "Side projects", amount: 980, percent: 15 },
      { categoryId: "cat-income-rent", name: "Rent", amount: 585, percent: 9 },
    ],
  },
};
export const Loading: Story = { args: { loading: true, rows: [] } };
export const Empty: Story = { args: { rows: [] } };
