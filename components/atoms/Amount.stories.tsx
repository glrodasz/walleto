import type { Meta, StoryObj } from "@storybook/nextjs";
import { Amount } from "./Amount";
import { CURRENCIES } from "../../constants";

const meta = {
  title: "Atoms/Amount",
  component: Amount,
  tags: ["autodocs"],
  args: { value: 4800, currency: "USD", size: "md" },
  argTypes: {
    size: { control: "radio", options: ["sm", "md", "lg"] },
    currency: { control: "select", options: CURRENCIES },
  },
} satisfies Meta<typeof Amount>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Large: Story = { args: { size: "lg", value: 12345.67 } };
export const Small: Story = { args: { size: "sm", value: 15.49 } };
/** Positive reads as accent, negative as hot. */
export const ColorizedNegative: Story = { args: { colorize: true, value: -320 } };
export const ColorizedPositive: Story = { args: { colorize: true, value: 1180 } };
/** Converted totals that mix currencies without live rates. */
export const Approximate: Story = { args: { approximate: true, value: 6231.4 } };
export const WithCode: Story = { args: { showCode: true, currency: "EUR", value: 900 } };
/** Zero-decimal currencies (COP, JPY) drop the cents. */
export const ZeroDecimal: Story = { args: { currency: "COP", value: 2400000 } };

export const AllCurrencies: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8 }}>
      {CURRENCIES.map((c) => (
        <Amount key={c} value={1234.5} currency={c} showCode />
      ))}
    </div>
  ),
};
