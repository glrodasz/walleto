import type { Meta, StoryObj } from "@storybook/nextjs";
import { ValuationRows } from "./ValuationRows";
import { column } from "../../../stories/decorators";
import { categoriesFor, STORY_ACCOUNTS, STORY_WINDOWS } from "../../../stories/fixtures";

const meta = {
  title: "Organisms/Investments/ValuationRows",
  component: ValuationRows,
  tags: ["autodocs"],
  args: {
    categories: categoriesFor("INVESTMENT"),
    accounts: STORY_ACCOUNTS,
    start: STORY_WINDOWS[0].start,
    end: STORY_WINDOWS[STORY_WINDOWS.length - 1].end,
  },
  decorators: [column],
} satisfies Meta<typeof ValuationRows>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Valuations recorded inside the window, read through the mocked hook. */
export const LastSevenMonths: Story = {};
export const CurrentMonth: Story = {
  args: { start: STORY_WINDOWS[STORY_WINDOWS.length - 1].start },
};
