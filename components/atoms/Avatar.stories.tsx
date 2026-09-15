import type { Meta, StoryObj } from "@storybook/nextjs";
import { Avatar } from "./Avatar";

const meta = {
  title: "Atoms/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  args: { name: "Ada Lovelace", size: 32 },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No email: the initial on a coloured disc. */
export const Initials: Story = {};
/** With an email the Gravatar is tried first and falls back to the initial. */
export const WithGravatar: Story = { args: { email: "ada@example.com" } };
export const Large: Story = { args: { size: 64, email: "ada@example.com" } };
export const Small: Story = { args: { size: 24 } };
export const UnknownName: Story = { args: { name: "" } };
