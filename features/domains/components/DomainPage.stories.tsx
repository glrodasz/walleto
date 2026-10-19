import type { Meta, StoryObj } from "@storybook/nextjs";
import { mocked } from "storybook/test";
import { DomainPage } from "./DomainPage";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useCategories } from "../../../hooks/useCategories";
import { hookDefaults, loadingState } from "../../../stories/fixtures/hookDefaults";
import { occurrenceId, occurrenceToTransaction } from "../../../helpers/materializeOccurrences";
import type { Transaction } from "../../../types";
import { at, MOBILE, screen, withHash } from "../../../stories/templates";

/**
 * The month-first screen the five domain routes share: month summary,
 * stacked bars, top categories, and the Plan / Activity / Categories /
 * Tags / Payment methods (/ Worth or Owed) views. A bare URL opens on Plan.
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

export const ActivityView: Story = {
  parameters: at("/expenses"),
  beforeEach: withHash("activity"),
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
/** A debt's Owed view: balances — repaid, owed, and the interest the checks revealed. */
export const DebtsBalanceView: Story = {
  args: { domain: "DEBT" },
  parameters: at("/debts"),
  beforeEach: withHash("value"),
};

/** "Total": the summary and the Categories view say what the savings hold at the month's end. */
const totalScope = (domain: string, hash: string) => () => {
  localStorage.setItem(`walleto:summary:${domain}:scope`, JSON.stringify("total"));
  withHash(hash)();
  return () => localStorage.removeItem(`walleto:summary:${domain}:scope`);
};
export const SavingsTotal: Story = {
  args: { domain: "SAVING" },
  parameters: at("/savings"),
  beforeEach: totalScope("SAVING", "categories"),
};
/** A debt's total is what it still owes, counted from its first balance check. */
export const DebtsTotal: Story = {
  args: { domain: "DEBT" },
  parameters: at("/debts"),
  beforeEach: totalScope("DEBT", "categories"),
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

/**
 * Car insurance went from 1,440 to 1,584 a year after it was paid: its
 * "Monthly share" still spreads the 1,440 paid (120 a month) until the next
 * renewal.
 */
export const SpreadAfterPriceRaise: Story = {
  parameters: at("/expenses"),
  beforeEach: () => {
    withHash("activity")();
    const items = hookDefaults
      .useRecurrentTransactions("EXPENSE")
      .items.map((i) => (i.id === "rt-car-insurance" ? { ...i, amount: 1584 } : i));
    mocked(useRecurrentTransactions).mockImplementation((d) => ({
      ...hookDefaults.useRecurrentTransactions(d),
      items,
    }));
    // The renewal it spreads, paid at the old price before the charts start.
    const insurance = items.find((i) => i.id === "rt-car-insurance")!;
    const renewal: Transaction = {
      ...occurrenceToTransaction({ ...insurance, amount: 1440 }, insurance.startDate.toDate()),
      id: occurrenceId(insurance.id!, insurance.startDate.toDate()),
      occurredAt: insurance.startDate,
      status: "PAID",
    };
    mocked(useDomainTransactions).mockImplementation((d, s) => {
      const base = hookDefaults.useDomainTransactions(d, s);
      return d === "EXPENSE" ? { ...base, transactions: [renewal, ...base.transactions] } : base;
    });
  },
};
