import type { Meta, StoryObj } from "@storybook/nextjs";
import { ProgressBar } from "./ProgressBar";
import { boxed } from "../../stories/decorators";

const meta = {
  title: "Molecules/ProgressBar",
  component: ProgressBar,
  tags: ["autodocs"],
  args: { ratio: 0.62, label: "62% of the plan" },
  argTypes: { ratio: { control: { type: "range", min: 0, max: 1, step: 0.01 } } },
  decorators: [boxed(360)],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const DomainColor: Story = { args: { color: "var(--domain-expense)", ratio: 0.9 } };
export const Thin: Story = { args: { height: 4, ratio: 0.3 } };
export const Complete: Story = { args: { ratio: 1 } };
export const Overflow: Story = { args: { ratio: 1.4, label: "140% of the plan" } };
