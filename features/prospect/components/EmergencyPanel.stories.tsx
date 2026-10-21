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
/** Investments counted, account by account: the pension stays invested. */
export const WithAccounts: Story = {
  args: {
    plan: {
      currency: "USD",
      benefitMonthly: 1_800,
      benefitMonths: 6,
      severance: 4_000,
      includeInvestments: true,
    },
    investments: 22_800,
    accounts: [
      { id: "isk", label: "Avanza - ISK", value: 18_300, available: true },
      { id: "crypto", label: "Coinbase", value: 4_500, available: true },
      { id: "pension", label: "AMF - Pension", value: 41_200, available: false },
    ],
    onToggleAccount: fn(),
  },
};
export const SaveFailed: Story = { args: { error: "Couldn't save your emergency income." } };
