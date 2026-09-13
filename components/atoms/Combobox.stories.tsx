import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { Combobox } from "./Combobox";

const SUGGESTIONS = ["Groceries", "Rent", "Streaming", "Gym", "Insurance", "Travel"];

const meta = {
  title: "Atoms/Combobox",
  component: Combobox,
  tags: ["autodocs"],
  args: {
    label: "New expense category",
    placeholder: "Search or create",
    suggestions: SUGGESTIONS,
    onSelect: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360, minHeight: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Uncontrolled "type or create, then reset": opens on focus, offers Create… for new text. */
export const TypeOrCreate: Story = {};
export const AutoFocus: Story = { args: { autoFocus: true } };
export const Disabled: Story = { args: { disabled: true } };

function ControlledField(props: React.ComponentProps<typeof Combobox>) {
  const [value, setValue] = useState("Visa");
  return <Combobox {...props} value={value} onSelect={setValue} />;
}

/** Controlled: a persistent form field (the card-network picker) that never clears itself. */
export const Controlled: Story = {
  args: {
    label: "Network",
    fieldLabel: "Network",
    suggestions: ["Visa", "Mastercard", "American Express"],
  },
  render: (args) => <ControlledField {...args} />,
};
