import type { Meta, StoryObj } from "@storybook/nextjs";
import { LanguageToggle } from "./LanguageToggle";

const meta: Meta<typeof LanguageToggle> = {
  title: "Molecules/LanguageToggle",
  component: LanguageToggle,
};
export default meta;

type Story = StoryObj<typeof LanguageToggle>;

/** On an English page it offers Spanish… */
export const OnEnglishPage: Story = {
  parameters: { nextjs: { router: { locale: "en", asPath: "/settings" } } },
};

/** …and on a Spanish page, English. */
export const OnSpanishPage: Story = {
  parameters: { nextjs: { router: { locale: "es", asPath: "/settings" } } },
};
