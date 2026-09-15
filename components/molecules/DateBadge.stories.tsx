import type { Meta, StoryObj } from "@storybook/nextjs";
import { DateBadge } from "./DateBadge";
import { daysFromNow } from "../../stories/fixtures";

const meta = {
  title: "Molecules/DateBadge",
  component: DateBadge,
  tags: ["autodocs"],
  args: { date: daysFromNow(3) },
} satisfies Meta<typeof DateBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The calendar leaf on upcoming-payment rows. */
export const Default: Story = {};
export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      {[0, 1, 5, 12, 27].map((d) => (
        <DateBadge key={d} date={daysFromNow(d)} />
      ))}
    </div>
  ),
};
