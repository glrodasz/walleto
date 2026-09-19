import type { Meta, StoryObj } from "@storybook/nextjs";
import { MonthlyBarsChart } from "./MonthlyBarsChart";
import { boxed } from "../../stories/decorators";
import { CURRENT_WINDOW, domainBars } from "../../stories/fixtures";

const expenses = domainBars("EXPENSE");
const incomes = domainBars("INCOME");

const meta = {
  title: "Molecules/MonthlyBarsChart",
  component: MonthlyBarsChart,
  tags: ["autodocs"],
  args: { ...expenses, currency: "USD", loading: false, stacked: true },
  decorators: [boxed(760)],
} satisfies Meta<typeof MonthlyBarsChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Expenses stacked by top categories; the current month shows what is still planned. */
export const StackedByCategory: Story = {};
export const WithAverage: Story = { args: { average: 2900 } };
export const SelectedMonth: Story = { args: { selectedKey: CURRENT_WINDOW.key } };
export const Incomes: Story = { args: { ...incomes } };
export const Unstacked: Story = { args: { stacked: false } };
export const Loading: Story = { args: { loading: true, data: [] } };
export const Empty: Story = {
  args: { data: expenses.data.map((d) => ({ key: d.key, label: d.label })) },
};

/**
 * Investments cap the stack with the gain their value checks reported. A month
 * that lost ground keeps its sign and is drawn below the axis, never clamped.
 */
export const WithGainAndLoss: Story = {
  args: {
    series: [
      { key: "contributed", label: "Invested", color: "var(--domain-investment)" },
      { key: "__gain", label: "Gain", color: "var(--bar-gain)" },
    ],
    data: [
      { key: "2026-05", label: "May", contributed: 1200, __gain: 0 },
      { key: "2026-06", label: "Jun", contributed: 1200, __gain: 640 },
      { key: "2026-07", label: "Jul", contributed: 1200, __gain: -880 },
      { key: "2026-08", label: "Aug", contributed: 1200, __gain: 1310 },
      { key: "2026-09", label: "Sep", contributed: 400, __gain: 210, isCurrent: true },
    ],
  },
};
