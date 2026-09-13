import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { SegmentedControl } from "./SegmentedControl";
import { Chart, Monitor, Moon, Sun } from "../atoms/Icons";

type Mode = "category" | "currency";
type Theme = "light" | "dark" | "system";

function Controlled<K extends string>(props: React.ComponentProps<typeof SegmentedControl<K>>) {
  const [value, setValue] = useState<K>(props.value);
  return <SegmentedControl<K> {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Molecules/SegmentedControl",
  component: SegmentedControl<Mode>,
  tags: ["autodocs"],
  args: {
    label: "Stack bars by",
    options: [
      { key: "category", label: "Category" },
      { key: "currency", label: "Currency" },
    ],
    value: "category",
    onChange: fn(),
    size: "md",
  },
  render: (args) => <Controlled<Mode> {...args} />,
} satisfies Meta<typeof SegmentedControl<Mode>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: "sm" } };
export const WithIcons: StoryObj<Meta<typeof SegmentedControl<Theme>>> = {
  render: () => (
    <Controlled<Theme>
      label="Theme"
      value="system"
      onChange={fn()}
      options={[
        { key: "light", label: "Light", icon: Sun },
        { key: "dark", label: "Dark", icon: Moon },
        { key: "system", label: "System", icon: Monitor },
      ]}
    />
  ),
};
export const IconOnlyLike: StoryObj<Meta<typeof SegmentedControl<Mode>>> = {
  render: () => (
    <Controlled<Mode>
      label="View"
      size="sm"
      value="category"
      onChange={fn()}
      options={[
        { key: "category", label: "Chart", icon: Chart },
        { key: "currency", label: "Table", icon: Monitor },
      ]}
    />
  ),
};
