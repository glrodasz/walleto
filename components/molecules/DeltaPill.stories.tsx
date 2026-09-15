import type { Meta, StoryObj } from "@storybook/nextjs";
import { DeltaPill } from "./DeltaPill";

const meta = {
  title: "Molecules/DeltaPill",
  component: DeltaPill,
  tags: ["autodocs"],
  args: { pct: 12.4, upIsGood: true },
} satisfies Meta<typeof DeltaPill>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Income up: good. */
export const UpGood: Story = {};
/** Expenses up: bad. */
export const UpBad: Story = { args: { upIsGood: false } };
export const DownGood: Story = { args: { pct: -8, upIsGood: false } };
export const DownBad: Story = { args: { pct: -8, upIsGood: true } };
export const CustomLabel: Story = { args: { pct: 3, label: "Up 3% versus August" } };
