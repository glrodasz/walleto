import type { Meta, StoryObj } from "@storybook/nextjs";
import { IconDisc } from "./IconDisc";
import { ArrowDown, ArrowUpRight, Cart, Circle, TrendingUp } from "../atoms/Icons";

const meta = {
  title: "Molecules/IconDisc",
  component: IconDisc,
  tags: ["autodocs"],
  args: { children: <Cart size={18} />, domain: "EXPENSE", size: 40 },
  argTypes: {
    domain: {
      control: "select",
      options: [undefined, "INCOME", "EXPENSE", "INVESTMENT", "SAVING", "DEBT"],
    },
  },
} satisfies Meta<typeof IconDisc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const CustomColor: Story = { args: { domain: undefined, color: "var(--palette-3)" } };
export const Small: Story = { args: { size: 28, children: <Cart size={14} /> } };

/** One disc per domain, as the dashboard stat cards use them. */
export const Domains: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12 }}>
      <IconDisc domain="INCOME">
        <ArrowUpRight size={18} />
      </IconDisc>
      <IconDisc domain="EXPENSE">
        <ArrowDown size={18} />
      </IconDisc>
      <IconDisc domain="INVESTMENT">
        <TrendingUp size={18} />
      </IconDisc>
      <IconDisc domain="SAVING">
        <Circle size={18} />
      </IconDisc>
    </div>
  ),
};
