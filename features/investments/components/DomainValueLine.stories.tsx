import type { Meta, StoryObj } from "@storybook/nextjs";
import { DomainValueLine } from "./DomainValueLine";
import { boxed } from "../../../stories/decorators";
import { categoriesFor } from "../../../stories/fixtures";

/** Reads accounts, deposits and valuations through the mocked hooks. */
const meta = {
  title: "Organisms/Investments/DomainValueLine",
  component: DomainValueLine,
  tags: ["autodocs"],
  args: { domain: "INVESTMENT", categories: categoriesFor("INVESTMENT"), currency: "USD" },
  decorators: [boxed(300)],
} satisfies Meta<typeof DomainValueLine>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The caption the dashboard card carries under its monthly run-rate. */
export const Investments: Story = {};
export const Savings: Story = { args: { domain: "SAVING", categories: categoriesFor("SAVING") } };
