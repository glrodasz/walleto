import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { TabStrip } from "./TabStrip";

const SECTIONS = [
  { key: "general", label: "General" },
  { key: "categories", label: "Categories" },
  { key: "tags", label: "Tags" },
  { key: "methods", label: "Payment methods" },
  { key: "accounts", label: "Accounts & debts" },
];

const DOMAINS = [
  { key: "INCOME", label: "Incomes", accent: "var(--domain-income)" },
  { key: "EXPENSE", label: "Expenses", accent: "var(--domain-expense)" },
  { key: "INVESTMENT", label: "Investments", accent: "var(--domain-investment)" },
  { key: "SAVING", label: "Savings", accent: "var(--domain-saving)" },
];

function Interactive(props: React.ComponentProps<typeof TabStrip>) {
  const [value, setValue] = useState(props.value);
  return <TabStrip {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Atoms/TabStrip",
  component: TabStrip,
  tags: ["autodocs"],
  args: { label: "Section", tabs: SECTIONS, value: "general", onChange: fn() },
  render: (args) => <Interactive {...args} />,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TabStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Settings: Story = {};
/** Each tab carries its own accent, as on the settings category cards. */
export const PerTabAccent: Story = { args: { label: "Domain", tabs: DOMAINS, value: "EXPENSE" } };
export const OneAccent: Story = {
  args: {
    label: "Domain",
    tabs: DOMAINS.map(({ key, label }) => ({ key, label })),
    value: "SAVING",
    accent: "var(--domain-saving)",
  },
};
export const Narrow: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
