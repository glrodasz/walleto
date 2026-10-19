import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { ScenarioToggle } from "./ScenarioToggle";

const meta: Meta<typeof ScenarioToggle> = {
  title: "Molecules/ScenarioToggle",
  component: ScenarioToggle,
  args: { value: "top", onChange: fn() },
};
export default meta;

export const Worst: StoryObj<typeof ScenarioToggle> = {};
export const Best: StoryObj<typeof ScenarioToggle> = { args: { value: "floor" } };
