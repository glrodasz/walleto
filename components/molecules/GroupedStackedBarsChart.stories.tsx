import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { GroupedStackedBarsChart } from "./GroupedStackedBarsChart";
import { boxed } from "../../stories/decorators";
import { cashFlow, CURRENT_WINDOW } from "../../stories/fixtures";

const byDomain = cashFlow(6, "domain");
const byCategory = cashFlow(6, "category");
const byCurrency = cashFlow(6, "currency");

const meta = {
  title: "Molecules/GroupedStackedBarsChart",
  component: GroupedStackedBarsChart,
  tags: ["autodocs"],
  args: { ...byDomain, currency: "USD", loading: false, onSelect: fn() },
  decorators: [boxed(760)],
} satisfies Meta<typeof GroupedStackedBarsChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Four domains side by side per month, one series each. */
export const ByDomain: Story = {};
export const ByCategory: Story = { args: { ...byCategory } };
export const ByCurrency: Story = { args: { ...byCurrency } };
export const SelectedMonth: Story = { args: { selectedKey: CURRENT_WINDOW.key } };
export const Loading: Story = { args: { loading: true, data: [] } };
