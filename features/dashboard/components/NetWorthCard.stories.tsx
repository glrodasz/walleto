import type { Meta, StoryObj } from "@storybook/nextjs";
import { NetWorthCard } from "./NetWorthCard";
import { boxed } from "../../../stories/decorators";
import type { NetWorth } from "../helpers/netWorth";

const WORTH: NetWorth = {
  investments: 31_240,
  savings: 8_400,
  debts: 12_600,
  net: 27_040,
  debtsUnknown: false,
  estimated: false,
  empty: false,
  lastCheckedAt: new Date(2026, 8, 12),
};

const meta = {
  title: "Organisms/Dashboard/NetWorthCard",
  component: NetWorthCard,
  tags: ["autodocs"],
  args: { worth: WORTH, currency: "USD" },
  decorators: [boxed(760)],
} satisfies Meta<typeof NetWorthCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Where the owner stands today: accounts and pockets minus what the debts owe. */
export const Default: Story = {};
/** Debts outweigh the assets. */
export const Negative: Story = {
  args: { worth: { ...WORTH, investments: 0, savings: 2_000, debts: 9_500, net: -7_500 } },
};
/** A debt exists but no balance was recorded: left out, and the card says so. */
export const DebtUnknown: Story = {
  args: { worth: { ...WORTH, debts: 0, net: 39_640, debtsUnknown: true } },
};
/** Nothing to value yet. */
export const Empty: Story = {
  args: {
    worth: {
      ...WORTH,
      investments: 0,
      savings: 0,
      debts: 0,
      net: 0,
      empty: true,
      lastCheckedAt: null,
    },
  },
};
export const Loading: Story = { args: { loading: true } };
export const Mobile: Story = { globals: { viewport: { value: "mobile1", isRotated: false } } };
