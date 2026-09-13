import type { Meta, StoryObj } from "@storybook/nextjs";
import { WhatIfSummary } from "./WhatIfSummary";
import { boxed } from "../../../stories/decorators";

const meta = {
  title: "Organisms/Prospect/WhatIfSummary",
  component: WhatIfSummary,
  tags: ["autodocs"],
  args: {
    impact: {
      freedMonthly: 210.48,
      freedAnnual: 2525.76,
      excludedNames: ["Netflix", "Gym", "Bitcoin DCA"],
    },
    currentNet: 1240.12,
    currency: "USD",
  },
  decorators: [boxed(420)],
} satisfies Meta<typeof WhatIfSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeCancelled: Story = {};
export const NothingCancelled: Story = {
  args: { impact: { freedMonthly: 0, freedAnnual: 0, excludedNames: [] } },
};
export const NegativeNet: Story = { args: { currentNet: -320 } };
