import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { CurrencyPicker } from "./CurrencyPicker";
import type { Currency } from "../../../types";

function Controlled(props: React.ComponentProps<typeof CurrencyPicker>) {
  const [value, setValue] = useState<Currency>(props.value);
  return <CurrencyPicker {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Organisms/Onboarding/CurrencyPicker",
  component: CurrencyPicker,
  tags: ["autodocs"],
  args: { value: "USD", onChange: fn() },
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof CurrencyPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The main-currency chips on the incomes step. */
export const Default: Story = {};
export const Colombia: Story = { args: { value: "COP" } };
