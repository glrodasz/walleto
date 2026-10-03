import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { IntroStage } from "./IntroStage";
import { INTRO_SLIDES } from "../data/introSlides";
import { boxed } from "../../../stories/decorators";

/**
 * One intro slide at a time, to review each scene on its own. Changing
 * `index` remounts the scene, so its pieces animate in again.
 */
const meta = {
  title: "Organisms/Onboarding/IntroStage",
  component: IntroStage,
  tags: ["autodocs"],
  decorators: [boxed(860)],
  args: { slides: INTRO_SLIDES, index: 0, direction: "forward", onSelect: fn() },
  argTypes: {
    index: { control: { type: "range", min: 0, max: INTRO_SLIDES.length - 1, step: 1 } },
    direction: { control: "inline-radio", options: ["forward", "back"] },
  },
} satisfies Meta<typeof IntroStage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Planner: Story = {};
export const Clarity: Story = { args: { index: 1 } };
export const Later: Story = { args: { index: 2 } };
export const Essentials: Story = { args: { index: 3 } };
export const Worth: Story = { args: { index: 4 } };
export const Currencies: Story = { args: { index: 5 } };
