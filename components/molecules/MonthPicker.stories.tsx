import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
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
