import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { ScenarioPicker } from "./ScenarioPicker";

const meta: Meta<typeof ScenarioPicker> = {
  title: "Molecules/ScenarioPicker",
  component: ScenarioPicker,
  args: { value: "top", onChange: fn() },
};
export default meta;

export const Worst: StoryObj<typeof ScenarioPicker> = {};
export const Best: StoryObj<typeof ScenarioPicker> = { args: { value: "floor" } };
