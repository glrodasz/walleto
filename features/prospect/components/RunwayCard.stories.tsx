import type { Meta, StoryObj } from "@storybook/nextjs";
import { RunwayCard } from "./RunwayCard";
import { boxed } from "../../../stories/decorators";

const meta = {
  title: "Organisms/Prospect/RunwayCard",
  component: RunwayCard,
  tags: ["autodocs"],
  args: {
    runway: 8.4,
    budget: {
      essentialMonthly: 2_480,
      debtMonthly: 410,
      burnMonthly: 2_890,
      pausedSpending: 64,
      pausedContributions: 900,
      fullMonthly: 3_854,
    },
    savings: 14_200,
    investments: 22_800,
    includeInvestments: false,
    benefitMonthly: 1_800,
    benefitMonths: 6,
    severance: 4_000,
    currency: "USD",
  },
  decorators: [boxed(960)],
} satisfies Meta<typeof RunwayCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solid: Story = {};
export const Tight: Story = { args: { runway: 4.2 } };
export const Critical: Story = {
  args: { runway: 1.3, benefitMonthly: 0, benefitMonths: 0, severance: 0 },
};
export const WithInvestments: Story = { args: { includeInvestments: true, runway: 17.9 } };
export const Covered: Story = { args: { runway: null } };
export const Loading: Story = { args: { loading: true } };
