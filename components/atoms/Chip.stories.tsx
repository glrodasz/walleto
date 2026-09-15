import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { Chip } from "./Chip";

const meta = {
  title: "Atoms/Chip",
  component: Chip,
  tags: ["autodocs"],
  args: { children: "Groceries" },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Static: Story = {};
export const Selectable: Story = { args: { onClick: fn(), selected: false } };
export const Selected: Story = { args: { onClick: fn(), selected: true } };
export const Removable: Story = {
  args: { onRemove: fn(), removeLabel: "Remove Groceries" },
};
export const Add: Story = { args: { variant: "add", onClick: fn(), children: "Add category" } };

export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Chip onRemove={fn()} removeLabel="Remove Home">
        Home & Family
      </Chip>
      <Chip onRemove={fn()} removeLabel="Remove Subscriptions">
        Subscriptions
      </Chip>
      <Chip onClick={fn()} selected>
        Credits
      </Chip>
      <Chip variant="add" onClick={fn()}>
        Add category
      </Chip>
    </div>
  ),
};
