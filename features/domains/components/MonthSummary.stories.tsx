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

/** Investments fold the month's reported gain into the figure, and say so. */
export const Investments: Story = {
  args: {
    domain: "INVESTMENT",
    realized: 8_100,
    expected: 8_100,
    delta: { current: 8_100, previous: 5_200, deltaPct: 55.8, previousKey: previous.key },
    contributed: 5_000,
    gain: 3_100,
  },
};

/** A month the market took back: the figure falls below what was paid in. */
export const InvestmentsLoss: Story = {
  args: {
    ...Investments.args,
    realized: 3_800,
    expected: 3_800,
    delta: { current: 3_800, previous: 5_200, deltaPct: -26.9, previousKey: previous.key },
    gain: -1_200,
  },
};
