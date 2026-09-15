import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { ScheduleFields } from "./ScheduleFields";
import type { ScheduleValue } from "./ScheduleFields";
import { boxed } from "../../stories/decorators";

const VALUE: ScheduleValue = { dayOfMonth: 12, secondDayOfMonth: 26, month: 2, date: "2026-09-14" };

function Controlled(props: React.ComponentProps<typeof ScheduleFields>) {
  const [value, setValue] = useState(props.value);
  return (
    <ScheduleFields
      {...props}
      value={value}
      onChange={(patch) => setValue((v) => ({ ...v, ...patch }))}
    />
  );
}

const meta = {
  title: "Molecules/ScheduleFields",
  component: ScheduleFields,
  tags: ["autodocs"],
  args: { frequency: "MONTHLY", value: VALUE, onChange: fn() },
  argTypes: {
    frequency: {
      control: "select",
      options: ["ONE_TIME", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"],
    },
  },
  render: (args) => <Controlled {...args} />,
  decorators: [boxed(420)],
} satisfies Meta<typeof ScheduleFields>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Which fields show depends on the frequency. */
export const Monthly: Story = {};
export const TwiceAMonth: Story = { args: { frequency: "BIWEEKLY" } };
export const Quarterly: Story = { args: { frequency: "QUARTERLY" } };
export const Yearly: Story = { args: { frequency: "YEARLY" } };
export const Weekly: Story = { args: { frequency: "WEEKLY" } };
export const OneTime: Story = { args: { frequency: "ONE_TIME" } };
export const Disabled: Story = { args: { disabled: true } };
