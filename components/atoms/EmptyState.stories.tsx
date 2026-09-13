import type { Meta, StoryObj } from "@storybook/nextjs";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "Atoms/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  args: {
    title: "No transactions yet",
    description: "Payments you record and charges from your recurring items will show up here.",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TitleOnly: Story = { args: { description: undefined, title: "Nothing planned" } };
