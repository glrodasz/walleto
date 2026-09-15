import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { CancelableItemsList } from "./CancelableItemsList";
import { boxed } from "../../../stories/decorators";
import { recurrentFor, STORY_CTX } from "../../../stories/fixtures";

const CANDIDATES = [
  ...recurrentFor("EXPENSE"),
  ...recurrentFor("INVESTMENT"),
  ...recurrentFor("SAVING"),
];

function Controlled(props: React.ComponentProps<typeof CancelableItemsList>) {
  const [excluded, setExcluded] = useState(new Set(props.excludedIds));
  const toggle = (id: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return <CancelableItemsList {...props} excludedIds={excluded} onToggle={toggle} />;
}

const meta = {
  title: "Organisms/Prospect/CancelableItemsList",
  component: CancelableItemsList,
  tags: ["autodocs"],
  args: {
    items: CANDIDATES,
    excludedIds: new Set<string>(),
    onToggle: fn(),
    ctx: STORY_CTX,
    currency: "USD",
    loading: false,
  },
  render: (args) => <Controlled {...args} />,
  decorators: [boxed(520)],
} satisfies Meta<typeof CancelableItemsList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Tick what you would cancel. */
export const Default: Story = {};
export const SomeCancelled: Story = {
  args: { excludedIds: new Set(["rt-netflix", "rt-gym", "rt-btc"]) },
};
export const Loading: Story = { args: { loading: true, items: [] } };
