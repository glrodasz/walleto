import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { Button } from "./Button";
import { Plus } from "./Icons";

const meta = {
  title: "Atoms/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Save changes", variant: "primary", size: "md", onClick: fn() },
  argTypes: {
    variant: { control: "radio", options: ["primary", "secondary", "ghost"] },
    size: { control: "radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary", children: "Cancel" } };
export const Ghost: Story = { args: { variant: "ghost", children: "Skip for now" } };
export const Small: Story = { args: { size: "sm", children: "Add" } };
export const Disabled: Story = { args: { disabled: true } };
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Plus size={16} /> New item
      </>
    ),
  },
};

/** Every variant and size side by side. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="primary" size="sm">
        Small
      </Button>
      <Button variant="secondary" size="sm">
        Small
      </Button>
      <Button variant="primary" disabled>
        Disabled
      </Button>
    </div>
  ),
};
