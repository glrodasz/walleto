import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn, userEvent, within } from "storybook/test";
import { MonthPicker } from "./MonthPicker";
import { monthWindows } from "../../features/domains/helpers/months";
import { NOW } from "../../stories/fixtures";

const WINDOWS = monthWindows(24, NOW);
const CURRENT = WINDOWS[WINDOWS.length - 1].key;

function Controlled(props: React.ComponentProps<typeof MonthPicker>) {
  const [value, setValue] = useState(props.value);
  return <MonthPicker {...props} value={value} onChange={setValue} onStep={undefined} />;
}

const meta = {
  title: "Molecules/MonthPicker",
  component: MonthPicker,
  tags: ["autodocs"],
  args: { value: CURRENT, windows: WINDOWS, onChange: fn() },
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof MonthPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Current month: the forward arrow is disabled, the app never looks ahead. */
export const CurrentMonth: Story = {};
export const PastMonth: Story = { args: { value: WINDOWS[WINDOWS.length - 4].key } };
export const Oldest: Story = { args: { value: WINDOWS[0].key } };

/** The list open: the last six months, with "Show more" at the foot. */
export const Open: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /^Month:/ }));
  },
};

/** "Show more" twice: the full two years, scrolling inside the list. */
export const ShowingTwoYears: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /^Month:/ }));
    // The list is portaled onto the body, outside the story's canvas.
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", { name: "Show last 12 months" }));
    await userEvent.click(await body.findByRole("button", { name: "Show last 24 months" }));
  },
};
