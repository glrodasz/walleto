import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn, mocked } from "storybook/test";
import { ReviewStep } from "./ReviewStep";
import { useReviewStep } from "../hooks/useReviewStep";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { boxed } from "../../../stories/decorators";
import { hookDefaults } from "../../../stories/fixtures/hookDefaults";

function Demo({ onEdit }: { onEdit: (href: string) => void }) {
  const state = useReviewStep();
  return <ReviewStep state={state} onEdit={onEdit} />;
}

const meta = {
  title: "Organisms/Onboarding/ReviewStep",
  component: Demo,
  tags: ["autodocs"],
  args: { onEdit: fn() },
  decorators: [boxed(860)],
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The demo plan: the dashboard hero, then every income and expense in it. */
export const Default: Story = {};
/** Expenses entered, no income yet: the verdict says so before Finish. */
export const OverCommitted: Story = {
  beforeEach: () => {
    mocked(useRecurrentTransactions).mockImplementation((domain) => ({
      ...hookDefaults.useRecurrentTransactions(domain),
      items: domain === "INCOME" ? [] : hookDefaults.useRecurrentTransactions(domain).items,
    }));
  },
};
export const Empty: Story = {
  beforeEach: () => {
    mocked(useRecurrentTransactions).mockImplementation((domain) => ({
      ...hookDefaults.useRecurrentTransactions(domain),
      items: [],
    }));
  },
};
