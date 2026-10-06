import type { Meta, StoryObj } from "@storybook/nextjs";
import { StepLead } from "./StepLead";
import { boxed } from "../../../stories/decorators";
import { MOBILE } from "../../../stories/templates";

/**
 * The intro slide a wizard step explains, at the top of that step. Phones
 * get the text alone.
 */
const meta = {
  title: "Organisms/Onboarding/StepLead",
  component: StepLead,
  tags: ["autodocs"],
  decorators: [boxed(860)],
  args: { id: "currencies" },
  argTypes: {
    id: { control: "inline-radio", options: ["currencies", "essentials", "worth"] },
  },
} satisfies Meta<typeof StepLead>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Leads the Currencies step. */
export const Currencies: Story = {};
/** Leads the Expenses step. */
export const Essentials: Story = { args: { id: "essentials" } };
/** Leads the Review step. */
export const Worth: Story = { args: { id: "worth" } };
export const Mobile: Story = { args: { id: "essentials" }, globals: MOBILE };
