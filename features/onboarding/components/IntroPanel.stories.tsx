import type { Meta, StoryObj } from "@storybook/nextjs";
import { IntroPanel } from "./IntroPanel";
import type { IntroSlideId } from "../data/introSlides";
import { INTRO_SLIDES } from "../data/introSlides";
import { boxed } from "../../../stories/decorators";
import { DESKTOP, MOBILE } from "../../../stories/templates";

/**
 * Each screen's intro slide, as the left column of the onboarding (≥1200px).
 * Changing `id` remounts the scene, so its pieces animate in again.
 */
const meta = {
  title: "Organisms/Onboarding/IntroPanel",
  component: IntroPanel,
  tags: ["autodocs"],
  decorators: [boxed(360)],
  // The panel only becomes a card at the onboarding's 1200px split.
  globals: DESKTOP,
  args: { id: "planner" },
  argTypes: {
    id: { control: "radio", options: Object.keys(INTRO_SLIDES) as IntroSlideId[] },
  },
} satisfies Meta<typeof IntroPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Welcome. */
export const Planner: Story = {};
/** Categories. */
export const Clarity: Story = { args: { id: "clarity" } };
/** Payment methods. */
export const Later: Story = { args: { id: "later" } };
export const Currencies: Story = { args: { id: "currencies" } };
export const Income: Story = { args: { id: "income" } };
export const Expenses: Story = { args: { id: "expenses" } };
/** Review. */
export const Worth: Story = { args: { id: "worth" } };
/** Stacked above a step: just the text. */
export const Stacked: Story = { args: { id: "income" }, globals: MOBILE };
/** Stacked, but with no form under it (the Welcome): the scene stays. */
export const WelcomeOnPhones: Story = {
  args: { id: "planner", sceneWhenStacked: true },
  globals: MOBILE,
};
