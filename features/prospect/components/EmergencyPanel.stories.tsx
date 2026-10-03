import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { EmergencyPanel } from "./EmergencyPanel";
import { boxed } from "../../../stories/decorators";

const meta = {
  title: "Organisms/Prospect/EmergencyPanel",
  component: EmergencyPanel,
  tags: ["autodocs"],
  args: {
    plan: {
      currency: "USD",
      benefitMonthly: 1_800,
      benefitMonths: 6,
      severance: 4_000,
      includeInvestments: false,
    },
    onSave: fn(),
    investments: 22_800,
    currency: "USD",
  },
  decorators: [boxed(520)],
} satisfies Meta<typeof EmergencyPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = {
  args: {
    plan: {
      currency: "USD",
      benefitMonthly: 0,
      benefitMonths: 0,
      severance: 0,
      includeInvestments: false,
    },
  },
};
export const SaveFailed: Story = { args: { error: "Couldn't save your emergency income." } };
