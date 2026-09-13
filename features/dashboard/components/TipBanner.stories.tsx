import type { Meta, StoryObj } from "@storybook/nextjs";
import { TipBanner } from "./TipBanner";
import { boxed } from "../../../stories/decorators";

const meta = {
  title: "Organisms/Dashboard/TipBanner",
  component: TipBanner,
  tags: ["autodocs"],
  args: {
    id: "storybook",
    children: "You can add a new transaction or recurring item from the + button.",
  },
  decorators: [boxed(760)],
  // Dismissal persists in localStorage per id; start every story visible.
  beforeEach: () => {
    try {
      localStorage.removeItem("waletto:tip:storybook");
    } catch {
      // storage off
    }
  },
} satisfies Meta<typeof TipBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dismiss it and it stays gone for this browser. */
export const Default: Story = {};
