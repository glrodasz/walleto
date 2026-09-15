import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { TransactionsTable } from "./TransactionsTable";
import { column } from "../../stories/decorators";
import {
  categoriesFor,
  recurrentFor,
  STORY_CTX,
  STORY_PAYMENT_METHODS,
  STORY_TAGS,
  STORY_TRANSACTIONS,
} from "../../stories/fixtures";

const expenses = STORY_TRANSACTIONS.filter((t) => t.domain === "EXPENSE");

const meta = {
  title: "Molecules/TransactionsTable",
  component: TransactionsTable,
  tags: ["autodocs"],
  args: {
    title: "Transactions",
    subtitle: "Everything paid, newest first",
    rows: expenses,
    domain: "EXPENSE",
    categories: categoriesFor("EXPENSE"),
    methods: STORY_PAYMENT_METHODS,
    tags: STORY_TAGS,
    items: recurrentFor("EXPENSE"),
    displayCurrency: "USD",
    ctx: STORY_CTX,
    onEdit: fn(),
    onDelete: fn(),
    deletingId: null,
    showMethod: true,
  },
  decorators: [column],
} satisfies Meta<typeof TransactionsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Search, category and method filters, sort, and the charged-currency pair per row. */
export const Expenses: Story = {};
export const Loading: Story = { args: { loading: true, rows: [] } };
export const Empty: Story = { args: { rows: [] } };
/** Rows whose recurring item is hidden from the dashboard carry a label. */
export const WithHiddenRows: Story = {
  args: {
    hiddenReason: (t) => (t.recurrentTransactionId === "rt-gym" ? "dashboard" : null),
  },
};
export const Deleting: Story = { args: { deletingId: expenses[expenses.length - 1]?.id ?? null } };
export const PresetFilter: Story = {
  args: { initialFilters: { search: "netflix" } },
};
export const Incomes: Story = {
  args: {
    title: "Incomes",
    subtitle: undefined,
    domain: "INCOME",
    rows: STORY_TRANSACTIONS.filter((t) => t.domain === "INCOME"),
    categories: categoriesFor("INCOME"),
    items: recurrentFor("INCOME"),
    showMethod: false,
  },
};
export const Limited: Story = { args: { limit: 5 } };
