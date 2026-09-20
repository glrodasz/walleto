import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { AccountCreator } from "./AccountCreator";
import { boxed } from "../../stories/decorators";
import { accountsFor } from "../../stories/fixtures";

const meta = {
  title: "Molecules/AccountCreator",
  component: AccountCreator,
  tags: ["autodocs"],
  args: {
    domain: "INVESTMENT",
    accounts: accountsFor("INVESTMENT"),
    defaultCurrency: "USD",
    createAccount: fn(async () => "acc-new"),
    onCreated: fn(),
    onCancel: fn(),
    onError: fn(),
  },
  decorators: [boxed(420)],
} satisfies Meta<typeof AccountCreator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Inline "new account" form for investments. */
export const Investment: Story = {};
/** Savings call them pockets. */
export const SavingPocket: Story = { args: { domain: "SAVING", accounts: accountsFor("SAVING") } };
/** A debt names its lender instead of a bank or broker. */
export const Debt: Story = { args: { domain: "DEBT", accounts: accountsFor("DEBT") } };
