import type { Meta, StoryObj } from "@storybook/nextjs";
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
  args: { ...byDomain, currency: "USD", loading: false },
  decorators: [boxed(760)],
} satisfies Meta<typeof GroupedStackedBarsChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Four domains side by side per month, one series each. */
export const ByDomain: Story = {};
/** Each bar is a stack: hovering one shows only its own series. */
export const ByCategory: Story = { args: { ...byCategory, tooltip: "bar" } };
export const ByCurrency: Story = { args: { ...byCurrency, tooltip: "bar" } };
export const SelectedMonth: Story = { args: { selectedKey: CURRENT_WINDOW.key } };
export const Loading: Story = { args: { loading: true, data: [] } };
