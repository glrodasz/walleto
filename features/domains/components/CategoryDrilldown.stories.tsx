import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { CategoryDrilldown } from "./CategoryDrilldown";
import { column } from "../../../stories/decorators";
import {
  categoriesFor,
  categoryById,
  CURRENT_WINDOW,
  recurrentFor,
  STORY_CTX,
  STORY_PAYMENT_METHODS,
  STORY_TAGS,
  transactionsFor,
} from "../../../stories/fixtures";

const meta = {
  title: "Organisms/Domains/CategoryDrilldown",
  component: CategoryDrilldown,
  tags: ["autodocs"],
  args: {
    category: categoryById("cat-expense-subs")!,
    categories: categoriesFor("EXPENSE"),
    transactions: transactionsFor("EXPENSE"),
    currency: "USD",
    ctx: STORY_CTX,
    tags: STORY_TAGS,
    methods: STORY_PAYMENT_METHODS,
    items: recurrentFor("EXPENSE"),
    monthLabel: CURRENT_WINDOW.longLabel,
    onBack: fn(),
    onEdit: fn(),
    onDelete: fn(),
    deletingId: null,
  },
  decorators: [column],
} satisfies Meta<typeof CategoryDrilldown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One category (children folded in) with its ledger rows for the month. */
export const Subscriptions: Story = {};
export const Variable: Story = { args: { category: categoryById("cat-expense-variable")! } };
export const Loading: Story = { args: { loading: true, transactions: [] } };
