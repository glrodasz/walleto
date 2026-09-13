import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { PaymentMethodField } from "./PaymentMethodField";
import { boxed } from "../../stories/decorators";
import { STORY_PAYMENT_METHODS } from "../../stories/fixtures";

function Controlled(props: React.ComponentProps<typeof PaymentMethodField>) {
  const [value, setValue] = useState(props.value);
  return <PaymentMethodField {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Molecules/PaymentMethodField",
  component: PaymentMethodField,
  tags: ["autodocs"],
  args: {
    methods: STORY_PAYMENT_METHODS,
    value: "pm-chase",
    onChange: fn(),
    createMethod: fn(async () => "pm-new"),
    onError: fn(),
  },
  render: (args) => <Controlled {...args} />,
  decorators: [boxed(360)],
} satisfies Meta<typeof PaymentMethodField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Grouped by type, with "Create…" to add one inline. */
export const Default: Story = {};
export const None: Story = { args: { value: "" } };
export const Required: Story = { args: { allowNone: false } };
export const Disabled: Story = { args: { disabled: true } };
