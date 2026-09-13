import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { AccountField } from "./AccountField";
import { boxed } from "../../stories/decorators";
import { accountsFor } from "../../stories/fixtures";

function Controlled(props: React.ComponentProps<typeof AccountField>) {
  const [value, setValue] = useState(props.value);
  return <AccountField {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Molecules/AccountField",
  component: AccountField,
  tags: ["autodocs"],
  args: {
    domain: "INVESTMENT",
    accounts: accountsFor("INVESTMENT"),
    value: "acc-avanza",
    onChange: fn(),
    createAccount: fn(async () => "acc-new"),
    defaultCurrency: "USD",
    onError: fn(),
  },
  render: (args) => <Controlled {...args} />,
  decorators: [boxed(360)],
} satisfies Meta<typeof AccountField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Select an account, or pick "Create…" to open the inline creator. */
export const Investment: Story = {};
export const NoAccount: Story = { args: { value: "" } };
export const SavingPocket: Story = {
  args: { domain: "SAVING", accounts: accountsFor("SAVING"), value: "acc-trip" },
};
export const Disabled: Story = { args: { disabled: true } };
