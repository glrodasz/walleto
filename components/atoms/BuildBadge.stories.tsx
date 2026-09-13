import type { Meta, StoryObj } from "@storybook/nextjs";
import { BuildBadge } from "./BuildBadge";

/**
 * Reads `NEXT_PUBLIC_APP_ENV` / `NEXT_PUBLIC_COMMIT_SHA` at build time.
 * Storybook is configured as a "preview" build (see .storybook/main.ts), so
 * the badge says Staging and links to the placeholder commit.
 */
const meta = {
  title: "Atoms/BuildBadge",
  component: BuildBadge,
  tags: ["autodocs"],
} satisfies Meta<typeof BuildBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};
