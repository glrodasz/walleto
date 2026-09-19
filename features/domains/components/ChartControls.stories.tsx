import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { ChartControls } from "./ChartControls";
import type { StackMode } from "./ChartControls";
import type { MonthPeriod } from "../../../constants";

function Controlled(props: React.ComponentProps<typeof ChartControls>) {
  const [period, setPeriod] = useState<MonthPeriod>(props.period);
  const [mode, setMode] = useState<StackMode>(props.mode);
  return (
    <ChartControls {...props} period={period} onPeriod={setPeriod} mode={mode} onMode={setMode} />
  );
}

const meta = {
  title: "Organisms/Domains/ChartControls",
  component: ChartControls,
  tags: ["autodocs"],
  args: { period: 6, onPeriod: fn(), mode: "category", onMode: fn() },
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof ChartControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ThreeMonths: Story = { args: { period: 3 } };
export const ByCurrencyTwelveMonths: Story = { args: { period: 12, mode: "currency" } };
