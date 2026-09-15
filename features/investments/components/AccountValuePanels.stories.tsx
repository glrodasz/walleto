import type { Meta, StoryObj } from "@storybook/nextjs";
import { AccountValuePanels } from "./AccountValuePanels";
import { column } from "../../../stories/decorators";
import { categoriesFor, categoryById, STORY_CTX } from "../../../stories/fixtures";

const meta = {
  title: "Organisms/Investments/AccountValuePanels",
  component: AccountValuePanels,
  tags: ["autodocs"],
  args: {
    domain: "INVESTMENT",
    category: categoryById("cat-investment-crypto")!,
    categories: categoriesFor("INVESTMENT"),
    ctx: STORY_CTX,
    currency: "USD",
  },
  decorators: [column],
} satisfies Meta<typeof AccountValuePanels>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The drilldown of one category: a value panel per account that holds it. */
export const Crypto: Story = {};
export const Banking: Story = { args: { category: categoryById("cat-investment-banking")! } };
