import type { Meta, StoryObj } from "@storybook/nextjs";
import Skeleton from "./Skeleton";

const meta = {
  title: "Atoms/Skeleton",
  component: Skeleton.Box,
  tags: ["autodocs"],
  args: { width: "100%", height: 120 },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Skeleton.Box>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The placeholder a card shows before its data arrives. */
export const Box: Story = {};
export const Circle: Story = { render: () => <Skeleton.Circle diameter={40} /> };
export const Text: Story = {
  render: () => <Skeleton.Text numberOfLines={3} lineHeight={14} lineWidth="80%" />,
};
export const CardShape: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Skeleton.Circle diameter={40} />
      <div style={{ flex: 1 }}>
        <Skeleton.Text numberOfLines={2} lineHeight={12} lineWidth="60%" />
      </div>
      <Skeleton.Box width={80} height={20} />
    </div>
  ),
};
