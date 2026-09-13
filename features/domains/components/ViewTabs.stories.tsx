import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { ViewTabs } from "./ViewTabs";
import type { DomainView } from "./ViewTabs";
import { boxed } from "../../../stories/decorators";

function Controlled(props: React.ComponentProps<typeof ViewTabs>) {
  const [value, setValue] = useState<DomainView>(props.value);
  return <ViewTabs {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Organisms/Domains/ViewTabs",
  component: ViewTabs,
  tags: ["autodocs"],
  args: { value: "transactions", onChange: fn(), accent: "var(--domain-expense)" },
  render: (args) => <Controlled {...args} />,
  decorators: [boxed(760)],
} satisfies Meta<typeof ViewTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Expenses: the payment-method view is on, there is no Value view. */
export const Expenses: Story = {};
/** Investments and savings add Value; incomes drop Payment methods. */
export const Investments: Story = {
  args: { accent: "var(--domain-investment)", showValue: true, showMethods: false, value: "value" },
};
export const Incomes: Story = { args: { accent: "var(--domain-income)", showMethods: false } };
