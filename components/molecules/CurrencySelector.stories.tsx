import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { CurrencySelector } from "./CurrencySelector";
import type { Currency } from "../../types";

function Controlled(props: React.ComponentProps<typeof CurrencySelector>) {
  const [value, setValue] = useState<Currency>(props.value);
  return <CurrencySelector {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Molecules/CurrencySelector",
  component: CurrencySelector,
  tags: ["autodocs"],
  args: { value: "USD", onChange: fn() },
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof CurrencySelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The header's display-currency switcher. */
export const Default: Story = {};
export const Euro: Story = { args: { value: "EUR" } };
