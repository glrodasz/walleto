import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { Last4Field } from "./Last4Field";
import { boxed } from "../../stories/decorators";

function Controlled(props: React.ComponentProps<typeof Last4Field>) {
  const [value, setValue] = useState(props.value);
  return <Last4Field {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Molecules/Last4Field",
  component: Last4Field,
  tags: ["autodocs"],
  args: { value: "", onChange: fn() },
  render: (args) => <Controlled {...args} />,
  decorators: [boxed(240)],
} satisfies Meta<typeof Last4Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = { args: { value: "4242" } };
/** A partial value after a save attempt. */
export const Partial: Story = { args: { value: "42", showError: true } };
export const Disabled: Story = { args: { value: "4242", disabled: true } };
