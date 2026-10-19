import type { Meta, StoryObj } from "@storybook/nextjs";
import { InvestmentValuePanel } from "./InvestmentValuePanel";
import { column } from "../../../stories/decorators";
import {
  NOW,
  STORY_CTX,
  STORY_USER_ID,
  STORY_VALUATIONS,
  transactionsFor,
  ts,
} from "../../../stories/fixtures";
import type { InvestmentValuation } from "../../../types";

/** Today's check, stored at noon like the form does: it counts from the morning. */
const todayAtNoon = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), 12);
const CHECKED_TODAY: InvestmentValuation = {
  id: "iv-coinbase-today",
  userId: STORY_USER_ID,
  domain: "INVESTMENT",
  accountId: "acc-coinbase",
  categoryId: "cat-investment-crypto",
  asOf: ts(todayAtNoon),
  costBasis: 1200,
  value: 1320,
  gainPct: 10,
  currency: "USD",
  createdAt: ts(todayAtNoon),
};

const meta = {
  title: "Organisms/Investments/InvestmentValuePanel",
  component: InvestmentValuePanel,
  tags: ["autodocs"],
  args: {
    domain: "INVESTMENT",
    selector: { accountId: "acc-coinbase" },
    title: "Coinbase",
    transactions: transactionsFor("INVESTMENT"),
    valuations: STORY_VALUATIONS,
    ctx: STORY_CTX,
    currency: "USD",
    accent: "var(--domain-investment)",
  },
  decorators: [column],
} satisfies Meta<typeof InvestmentValuePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Deposits, latest value, gain and the valuation history for one account. */
export const Coinbase: Story = {};
/** A check recorded today: the current value is that check, whatever the hour. */
export const CheckedToday: Story = {
  args: {
    valuations: [...STORY_VALUATIONS.filter((v) => v.id !== "iv-coinbase-0"), CHECKED_TODAY],
  },
};
export const WithInterestRate: Story = {
  args: {
    selector: { accountId: "acc-avanza" },
    title: "Avanza ISK",
    rate: { value: 7, period: "YEARLY" },
  },
};
/** A debt: repaid against owed, and the interest accrued since the first balance. */
export const Debt: Story = {
  args: {
    domain: "DEBT",
    selector: { accountId: "acc-visa" },
    title: "Visa Gold",
    rate: { value: 19.9, period: "YEARLY" },
    transactions: transactionsFor("DEBT"),
    accent: "var(--domain-debt)",
  },
};
export const NoValuations: Story = {
  args: { selector: { domain: "INVESTMENT" }, title: "No account", valuations: [] },
};
export const Loading: Story = { args: { loading: true } };
