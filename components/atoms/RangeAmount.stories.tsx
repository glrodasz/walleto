import type { Meta, StoryObj } from "@storybook/nextjs";
import { RangeAmount } from "./RangeAmount";

const meta: Meta<typeof RangeAmount> = {
  title: "Atoms/RangeAmount",
  component: RangeAmount,
  args: { from: "€400.00", to: "€600.00" },
};
export default meta;

export const Default: StoryObj<typeof RangeAmount> = {};
export const ForeignCode: StoryObj<typeof RangeAmount> = {
  args: { from: "COP 700,000", to: "COP 1,000,000" },
};
