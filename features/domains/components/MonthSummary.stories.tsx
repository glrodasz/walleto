import type { Meta, StoryObj } from "@storybook/nextjs";
import { MonthSummary } from "./MonthSummary";
import { boxed } from "../../../stories/decorators";
import { CURRENT_WINDOW, domainTotals, STORY_WINDOWS } from "../../../stories/fixtures";

const expenses = domainTotals("EXPENSE");
const previous = STORY_WINDOWS[STORY_WINDOWS.length - 2];

const meta = {
  title: "Organisms/Domains/MonthSummary",
  component: MonthSummary,
  tags: ["autodocs"],
  args: {
    domain: "EXPENSE",
    window: CURRENT_WINDOW,
    realized: expenses.delta.current,
    expected: expenses.delta.current + 480,
    delta: expenses.delta,
    previousLabel: previous.label,
    currency: "USD",
  },
  decorators: [boxed(760)],
} satisfies Meta<typeof MonthSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The month so far against the plan and the month before. */
export const Expenses: Story = {};
export const Incomes: Story = {
  args: {
    domain: "INCOME",
    ...(() => {
      const t = domainTotals("INCOME");
      return { realized: t.delta.current, expected: t.delta.current + 900, delta: t.delta };
    })(),
  },
};
export const Approximate: Story = { args: { approximate: true } };
export const NoPreviousMonth: Story = {
  args: { delta: { ...expenses.delta, deltaPct: null, previousKey: null }, previousLabel: null },
};
export const PlanMet: Story = { args: { expected: expenses.delta.current } };
