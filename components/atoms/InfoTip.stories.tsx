import type { Meta, StoryObj } from "@storybook/nextjs";
import { InfoTip } from "./InfoTip";

const meta = {
  title: "Atoms/InfoTip",
  component: InfoTip,
  tags: ["autodocs"],
  args: {
    label: "How to finish setup later",
    children:
      "Everything you've saved stays. Run setup again anytime from Settings › Setup, or add categories, payment methods and plan items later on their own.",
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "160px 24px 24px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InfoTip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Below: Story = {
  args: { placement: "bottom" },
  decorators: [
    (Story) => (
      <div style={{ marginTop: -136 }}>
        <Story />
      </div>
    ),
  ],
};
export const InlineWithText: Story = {
  render: (args) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--fg-1)" }}>
      Continue later <InfoTip {...args} />
    </span>
  ),
};
