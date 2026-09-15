import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { SectionTitle } from "./SectionTitle";
import { Select } from "./Select";

const meta = {
  title: "Atoms/SectionTitle",
  component: SectionTitle,
  tags: ["autodocs"],
  args: { title: "Top expense categories" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 520 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithSubtitle: Story = { args: { subtitle: "Where this month's money went" } };
export const WithLink: Story = { args: { href: "/expenses", actionLabel: "View all" } };
export const WithAction: Story = {
  args: { onAction: fn(), actionLabel: "Record value" },
};
export const WithControls: Story = {
  args: {
    title: "Cash flow",
    children: (
      <Select
        flat
        aria-label="Period"
        options={[
          { value: "3", label: "3 months" },
          { value: "6", label: "6 months" },
        ]}
        defaultValue="6"
      />
    ),
  },
};
