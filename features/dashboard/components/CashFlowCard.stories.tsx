import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { CashFlowCard } from "./CashFlowCard";
import type { MonthPeriod } from "../../../constants";
import type { CashFlowGroupBy } from "../helpers/cashFlowSeries";
import { column } from "../../../stories/decorators";
import { cashFlow, CURRENT_WINDOW } from "../../../stories/fixtures";

/** Wires the period and group-by controls to real series, as the dashboard does. */
function Live(props: React.ComponentProps<typeof CashFlowCard>) {
  const [period, setPeriod] = useState<MonthPeriod>(props.period);
  const [groupBy, setGroupBy] = useState<CashFlowGroupBy>(props.groupBy);
  const series = cashFlow(period, groupBy);
  return (
    <CashFlowCard
      {...props}
      {...series}
      period={period}
      onPeriod={setPeriod}
      groupBy={groupBy}
      onGroupBy={setGroupBy}
    />
  );
}

const meta = {
  title: "Organisms/Dashboard/CashFlowCard",
  component: CashFlowCard,
  tags: ["autodocs"],
  args: {
    ...cashFlow(6, "domain"),
    currency: "USD",
    loading: false,
    period: 6,
    onPeriod: fn(),
    groupBy: "domain",
    onGroupBy: fn(),
  },
  render: (args) => <Live {...args} />,
  decorators: [column],
} satisfies Meta<typeof CashFlowCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ByDomain: Story = {};
export const ByCategory: Story = { args: { groupBy: "category" } };
export const ByCurrency: Story = { args: { groupBy: "currency" } };
export const TwelveMonths: Story = { args: { period: 12 } };
export const MonthSelected: Story = { args: { selectedKey: CURRENT_WINDOW.key } };
export const Loading: Story = {
  args: { loading: true, data: [] },
  render: (args) => <CashFlowCard {...args} />,
};
