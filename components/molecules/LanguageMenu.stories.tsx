import type { Meta, StoryObj } from "@storybook/nextjs";
import { LanguagePreference } from "./LanguageMenu";

/** Use the Language toolbar to see it from the Spanish or Portuguese side. */
const meta: Meta<typeof LanguagePreference> = {
  title: "Molecules/LanguageMenu",
  component: LanguagePreference,
};
export default meta;

type Story = StoryObj<typeof LanguagePreference>;

export const Default: Story = {};
