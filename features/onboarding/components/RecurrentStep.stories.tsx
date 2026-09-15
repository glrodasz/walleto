import type { Meta, StoryObj } from "@storybook/nextjs";
import { mocked } from "storybook/test";
import { RecurrentStep } from "./RecurrentStep";
import { useRecurrentStep } from "../hooks/useRecurrentStep";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { boxed } from "../../../stories/decorators";
import { hookDefaults } from "../../../stories/fixtures/hookDefaults";
import type { Currency, Domain } from "../../../types";

function Demo({
  domain,
  currency,
  showPaymentMethod,
}: {
  domain: Domain;
  currency: Currency;
  showPaymentMethod?: boolean;
}) {
  const state = useRecurrentStep(domain, currency);
  return <RecurrentStep state={state} showPaymentMethod={showPaymentMethod} />;
}

const meta = {
  title: "Organisms/Onboarding/RecurrentStep",
  component: Demo,
  tags: ["autodocs"],
  args: { domain: "EXPENSE", currency: "USD", showPaymentMethod: true },
  decorators: [boxed(960)],
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Expenses: rows grouped by cadence, hydrated from the saved plan, with a payment method per row. */
export const Expenses: Story = {};
export const Incomes: Story = { args: { domain: "INCOME", showPaymentMethod: false } };
export const FreshStart: Story = {
  beforeEach: () => {
    mocked(useRecurrentTransactions).mockImplementation((domain) => ({
      ...hookDefaults.useRecurrentTransactions(domain),
      items: [],
    }));
  },
};
