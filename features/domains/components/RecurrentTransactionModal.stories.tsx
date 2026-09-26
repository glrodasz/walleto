import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { RecurrentTransactionModal } from "./RecurrentTransactionModal";
import { Button } from "../../../components/atoms/Button";
import { recurrentById, STORY_TRANSACTIONS } from "../../../stories/fixtures";

function Launcher(props: React.ComponentProps<typeof RecurrentTransactionModal>) {
  const [open, setOpen] = useState(props.open);
  return (
    <div style={{ padding: 24 }}>
      <Button onClick={() => setOpen(true)}>Open form</Button>
      <RecurrentTransactionModal {...props} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

/**
 * The one form for everything that enters: a recurring item, a one-off
 * payment, or an edit of either. Categories, methods, tags and accounts
 * come from the mocked hooks.
 */
const meta = {
  title: "Organisms/Domains/RecurrentTransactionModal",
  component: RecurrentTransactionModal,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { domain: "EXPENSE", open: true, onClose: fn(), onOpenItem: fn() },
  render: (args) => <Launcher {...args} />,
} satisfies Meta<typeof RecurrentTransactionModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A new monthly expense. */
export const NewRecurring: Story = {};
/** "Log a one-off expense": one time, writes a PAID transaction. */
export const OneTimePayment: Story = { args: { initialFrequency: "ONE_TIME" } };
export const EditItem: Story = { args: { item: recurrentById("rt-netflix") } };
export const EditYearlySpread: Story = { args: { item: recurrentById("rt-car-insurance") } };
export const EditTransaction: Story = {
  args: { transaction: STORY_TRANSACTIONS.find((t) => t.id === "tx-flight") },
};
/** Investments pick an account and can record the value in the same go. */
export const Investment: Story = { args: { domain: "INVESTMENT" } };
/** A one-off on an account can go either way: deposit or withdrawal (borrowed, on a debt). */
export const Withdrawal: Story = { args: { domain: "SAVING", initialFrequency: "ONE_TIME" } };
export const Income: Story = { args: { domain: "INCOME" } };
export const Mobile: Story = { globals: { viewport: { value: "mobile1", isRotated: false } } };
