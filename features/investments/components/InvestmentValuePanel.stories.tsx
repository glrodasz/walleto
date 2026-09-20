import type { Meta, StoryObj } from "@storybook/nextjs";
import { InvestmentValuePanel } from "./InvestmentValuePanel";
import { column } from "../../../stories/decorators";
import { STORY_CTX, STORY_VALUATIONS, transactionsFor } from "../../../stories/fixtures";

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
