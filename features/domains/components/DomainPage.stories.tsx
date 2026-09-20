import type { Meta, StoryObj } from "@storybook/nextjs";
import { mocked } from "storybook/test";
import { DomainPage } from "./DomainPage";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useCategories } from "../../../hooks/useCategories";
import { hookDefaults, loadingState } from "../../../stories/fixtures/hookDefaults";
import { at, MOBILE, screen, withHash } from "../../../stories/templates";

/**
 * The month-first screen the five domain routes share: month summary,
 * stacked bars, top categories, and the Transactions / Recurring /
 * Categories / Tags / Payment methods (/ Value or Balance) views.
 */
const meta = {
  title: "Templates/Domain page",
  component: DomainPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { domain: "EXPENSE" },
  decorators: [screen],
  beforeEach: withHash(""),
} satisfies Meta<typeof DomainPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expenses: Story = { parameters: at("/expenses") };
export const Incomes: Story = { args: { domain: "INCOME" }, parameters: at("/incomes") };
export const Investments: Story = {
  args: { domain: "INVESTMENT" },
  parameters: at("/investments"),
};
export const Savings: Story = { args: { domain: "SAVING" }, parameters: at("/savings") };
export const Debts: Story = { args: { domain: "DEBT" }, parameters: at("/debts") };

export const RecurringView: Story = {
  parameters: at("/expenses"),
  beforeEach: withHash("recurring"),
};
export const CategoriesView: Story = {
  parameters: at("/expenses"),
  beforeEach: withHash("categories"),
};
export const TagsView: Story = { parameters: at("/expenses"), beforeEach: withHash("tags") };
export const MethodsView: Story = { parameters: at("/expenses"), beforeEach: withHash("methods") };
export const ValueView: Story = {
  args: { domain: "INVESTMENT" },
  parameters: at("/investments"),
  beforeEach: withHash("value"),
};
/** A debt's Value view: balances — repaid, owed, and the interest the checks revealed. */
export const DebtsBalanceView: Story = {
  args: { domain: "DEBT" },
  parameters: at("/debts"),
  beforeEach: withHash("value"),
};

export const Loading: Story = {
  parameters: at("/expenses"),
  beforeEach: () => {
    withHash("")();
    mocked(useCategories).mockImplementation((d) => ({
      ...hookDefaults.useCategories(d),
      categories: [],
      ...loadingState,
    }));
    mocked(useDomainTransactions).mockImplementation((d, s) => ({
      ...hookDefaults.useDomainTransactions(d, s),
      transactions: [],
      ...loadingState,
    }));
  },
};

export const Empty: Story = {
  parameters: at("/expenses"),
  beforeEach: () => {
    withHash("")();
    mocked(useRecurrentTransactions).mockImplementation((d) => ({
      ...hookDefaults.useRecurrentTransactions(d),
      items: [],
    }));
    mocked(useDomainTransactions).mockImplementation((d, s) => ({
      ...hookDefaults.useDomainTransactions(d, s),
      transactions: [],
    }));
  },
};

export const Mobile: Story = { parameters: at("/expenses"), globals: MOBILE };
