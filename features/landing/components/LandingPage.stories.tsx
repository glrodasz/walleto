import type { Meta, StoryObj } from "@storybook/nextjs";
import { LandingPage } from "./LandingPage";
import type { Language } from "../../../types";
import { at, MOBILE, screen } from "../../../stories/templates";

/**
 * The public landing (/, /en, /es). It takes its language as a prop rather
 * than from preferences, so the story feeds it the toolbar's language.
 */
const meta = {
  title: "Templates/Landing",
  component: LandingPage,
  parameters: { layout: "fullscreen", ...at("/en") },
  decorators: [screen],
  args: { language: "en", origin: "https://walleto.example" },
  render: (args, { globals }) => (
    <LandingPage {...args} language={(globals.locale as Language) ?? args.language} />
  ),
} satisfies Meta<typeof LandingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SignedIn: Story = { args: { signedIn: true } };

export const Mobile: Story = { globals: MOBILE };
