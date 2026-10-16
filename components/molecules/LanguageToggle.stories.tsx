import type { Meta, StoryObj } from "@storybook/nextjs";
import { LanguageToggle } from "./LanguageToggle";

/** Use the Language toolbar to see it from the Spanish side. */
const meta: Meta<typeof LanguageToggle> = {
  title: "Molecules/LanguageToggle",
  component: LanguageToggle,
};
export default meta;

type Story = StoryObj<typeof LanguageToggle>;

export const Default: Story = {};
