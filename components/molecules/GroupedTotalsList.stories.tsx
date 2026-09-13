import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { GroupedTotalsList } from "./GroupedTotalsList";
import { CreditCard, Tag } from "../atoms/Icons";
import { boxed } from "../../stories/decorators";

const BY_TAG = [
  { key: "tag-family", label: "Family", total: 1682.99, count: 3, share: 0.58 },
  { key: "tag-trip", label: "Trip2026", total: 1180, count: 1, share: 0.4 },
  { key: "__none", label: "No tag", total: 64, count: 2, share: 0.02 },
];

const meta = {
  title: "Molecules/GroupedTotalsList",
  component: GroupedTotalsList,
  tags: ["autodocs"],
  args: {
    groups: BY_TAG,
    currency: "USD",
    color: "var(--domain-expense)",
    emptyLabel: "No tagged expenses this month.",
    icon: () => <Tag size={16} />,
    onSelect: fn(),
  },
  decorators: [boxed(560)],
} satisfies Meta<typeof GroupedTotalsList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A domain page's "by tag" view. */
export const ByTag: Story = {};
export const ByMethod: Story = {
  args: {
    icon: () => <CreditCard size={16} />,
    groups: [
      { key: "pm-chase", label: "Chase Sapphire · 4242", total: 2038.48, count: 5, share: 0.7 },
      { key: "pm-revolut", label: "Revolut", total: 19.5, count: 1, share: 0.01 },
      { key: "__none", label: "No method", total: 850, count: 2, share: 0.29 },
    ],
  },
};
export const Loading: Story = { args: { loading: true, groups: [] } };
export const Empty: Story = { args: { groups: [] } };
