import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { TextField } from "./TextField";
import { Search } from "./Icons";

const meta = {
  title: "Atoms/TextField",
  component: TextField,
  tags: ["autodocs"],
  args: { label: "Name", placeholder: "Groceries", onValueChange: fn() },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithIcon: Story = {
  args: {
    label: undefined,
    icon: <Search size={16} />,
    placeholder: "Search transactions",
    type: "search",
  },
};
/** Money fields: currency prefix, right-aligned digits. */
export const Amount: Story = {
  args: { label: "Amount", prefix: "$", align: "right", inputMode: "decimal", placeholder: "0.00" },
};
export const Filled: Story = { args: { defaultValue: "Chase Sapphire" } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "Locked" } };
export const Invalid: Story = { args: { "aria-invalid": true, defaultValue: "", required: true } };
