import type { Meta, StoryObj } from "@storybook/nextjs";
import { SummaryCard } from "./SummaryCard";
import type { SummaryStat } from "./SummaryCard";
import { AllocationBar } from "./AllocationBar";
import { Amount } from "../../../components/atoms/Amount";
import {
  ArrowDown,
  ArrowUpRight,
  Circle,
  CreditCard,
  TrendingUp,
} from "../../../components/atoms/Icons";
import { boxed } from "../../../stories/decorators";
import { STORY_FLOW_SUMMARY } from "../../../stories/fixtures/flow";

const FIVE: SummaryStat[] = [
  { key: "income", label: "Income", domain: "INCOME", Icon: ArrowUpRight, value: "$6,363.63" },
  { key: "expenses", label: "Expenses", domain: "EXPENSE", Icon: ArrowDown, value: "$2,567.06" },
  { key: "inv", label: "Investments", domain: "INVESTMENT", Icon: TrendingUp, value: "$621.70" },
  { key: "savings", label: "Savings", domain: "SAVING", Icon: Circle, value: "$617.39" },
  { key: "debts", label: "Debts", domain: "DEBT", Icon: CreditCard, value: "$1,174.53" },
];

const meta = {
  title: "Organisms/Dashboard/SummaryCard",
  component: SummaryCard,
  tags: ["autodocs"],
  args: {
    title: "Monthly plan",
    badge: { label: "On plan", tone: "success" },
    figure: <Amount value={1382.95} currency="USD" size="lg" colorize />,
    sub: "left to allocate each month",
    stats: FIVE,
    footer: <AllocationBar flow={STORY_FLOW_SUMMARY} />,
  },
  decorators: [boxed(960)],
} satisfies Meta<typeof SummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The shape both dashboard hero cards share: five stats and a footer bar. */
export const FiveStats: Story = {};
/** Three stats and a caveat, as net worth uses it. */
export const ThreeStatsWithNote: Story = {
  args: {
    title: "Net worth",
    badge: { label: "Today", tone: "info" },
    figure: <Amount value={27040} currency="USD" size="lg" colorize />,
    sub: "What you own minus what you owe · last checked Sep 12",
    stats: [
      FIVE[2],
      FIVE[3],
      { key: "owed", label: "Owed on debts", domain: "DEBT", Icon: CreditCard, value: "—" },
    ],
    footer: undefined,
    note: "A debt has no recorded balance yet, so it isn't counted.",
  },
};
/** No breakdown: the inset panel disappears and the copy stands alone. */
export const NoStats: Story = {
  args: {
    title: "Net worth",
    badge: { label: "Today", tone: "info" },
    figure: undefined,
    sub: "Add your accounts, then update what each is worth to see where you stand.",
    stats: [],
    footer: undefined,
  },
};
export const Mobile: Story = { globals: { viewport: { value: "mobile1", isRotated: false } } };
