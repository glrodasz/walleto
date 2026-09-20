import type { Meta, StoryObj } from "@storybook/nextjs";
import { AccountValueList } from "./AccountValueList";
import { column } from "../../../stories/decorators";
import { categoriesFor, STORY_CTX } from "../../../stories/fixtures";

/** Reads accounts, deposits and valuations through the mocked hooks. */
const meta = {
  title: "Organisms/Investments/AccountValueList",
  component: AccountValueList,
  tags: ["autodocs"],
  args: {
    domain: "INVESTMENT",
    categories: categoriesFor("INVESTMENT"),
    ctx: STORY_CTX,
    currency: "USD",
  },
  decorators: [column],
} satisfies Meta<typeof AccountValueList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Invested vs current value per account, with the interest estimate where a rate is set. */
export const Investments: Story = {};
export const Savings: Story = { args: { domain: "SAVING", categories: categoriesFor("SAVING") } };
/** Debts read as balances: repaid, owed, and a dash until a balance is recorded. */
export const Debts: Story = { args: { domain: "DEBT", categories: categoriesFor("DEBT") } };
