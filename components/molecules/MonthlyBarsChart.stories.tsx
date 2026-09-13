import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { MonthlyBarsChart } from "./MonthlyBarsChart";
import { boxed } from "../../stories/decorators";
import { CURRENT_WINDOW, domainBars } from "../../stories/fixtures";

const expenses = domainBars("EXPENSE");
const incomes = domainBars("INCOME");

const meta = {
  title: "Molecules/MonthlyBarsChart",
  component: MonthlyBarsChart,
  tags: ["autodocs"],
  args: { ...expenses, currency: "USD", loading: false, stacked: true, onSelect: fn() },
  decorators: [boxed(760)],
} satisfies Meta<typeof MonthlyBarsChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Seven months of expenses stacked by top categories; the current month shows what is still planned. */
export const StackedByCategory: Story = {};
export const WithAverage: Story = { args: { average: 2900 } };
export const SelectedMonth: Story = { args: { selectedKey: CURRENT_WINDOW.key } };
export const Incomes: Story = { args: { ...incomes } };
export const Unstacked: Story = { args: { stacked: false } };
export const Loading: Story = { args: { loading: true, data: [] } };
export const Empty: Story = {
  args: { data: expenses.data.map((d) => ({ key: d.key, label: d.label })) },
};
