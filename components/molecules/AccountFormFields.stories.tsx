import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { AccountFormFields } from "./AccountFormFields";
import { boxed } from "../../stories/decorators";
import { emptyAccountDraft } from "../../helpers/accountDraft";
import type { AccountDraft } from "../../helpers/accountDraft";
import type { AccountDomain } from "../../types";

function Controlled({ domain, initial }: { domain: AccountDomain; initial: AccountDraft }) {
  const [draft, setDraft] = useState(initial);
  return <AccountFormFields domain={domain} draft={draft} onChange={setDraft} />;
}

const meta = {
  title: "Molecules/AccountFormFields",
  component: Controlled,
  tags: ["autodocs"],
  args: { domain: "INVESTMENT", initial: emptyAccountDraft("USD") },
  decorators: [boxed(560)],
} satisfies Meta<typeof Controlled>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty, as the creator opens. */
export const Investment: Story = {};
/** Prefilled, as editing a pocket opens. */
export const SavingPocket: Story = {
  args: {
    domain: "SAVING",
    initial: { name: "Buffer", provider: "SEB", currency: "SEK", rate: "2.5", period: "YEARLY" },
  },
};
/** A debt names its lender instead of a bank or broker. */
export const Debt: Story = { args: { domain: "DEBT", initial: emptyAccountDraft("USD") } };
