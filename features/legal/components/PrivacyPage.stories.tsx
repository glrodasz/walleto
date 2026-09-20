import type { Meta, StoryObj } from "@storybook/nextjs";
import { PrivacyPage } from "./PrivacyPage";

const meta = {
  title: "Templates/Privacy",
  component: PrivacyPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PrivacyPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
