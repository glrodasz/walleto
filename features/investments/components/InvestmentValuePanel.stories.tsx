import type { Meta, StoryObj } from "@storybook/nextjs";
import { InvestmentValuePanel } from "./InvestmentValuePanel";
import { column } from "../../../stories/decorators";
import { STORY_CTX, STORY_VALUATIONS, transactionsFor } from "../../../stories/fixtures";

const meta = {
  title: "Organisms/Investments/InvestmentValuePanel",
  component: InvestmentValuePanel,
  tags: ["autodocs"],
  args: {
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
export const NoValuations: Story = {
  args: { selector: { domain: "INVESTMENT" }, title: "No account", valuations: [] },
};
export const Loading: Story = { args: { loading: true } };
