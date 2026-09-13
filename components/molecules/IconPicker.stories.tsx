import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { IconPicker } from "./IconPicker";
import { boxed } from "../../stories/decorators";
import type { IconKey } from "../../types";

function Controlled(props: React.ComponentProps<typeof IconPicker>) {
  const [value, setValue] = useState<IconKey | undefined>(props.value);
  return <IconPicker {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Molecules/IconPicker",
  component: IconPicker,
  tags: ["autodocs"],
  args: { value: "cart", onChange: fn() },
  render: (args) => <Controlled {...args} />,
  decorators: [boxed(360)],
} satisfies Meta<typeof IconPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Unset: Story = { args: { value: undefined } };
export const Disabled: Story = { args: { disabled: true } };
