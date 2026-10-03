import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { CancelableItemsList } from "./CancelableItemsList";
import { rankCancelable } from "../helpers/rankCancelable";
import { boxed } from "../../../stories/decorators";
import { recurrentFor, STORY_CATEGORIES, STORY_CTX } from "../../../stories/fixtures";

const GROUPS = rankCancelable(
  [
    ...recurrentFor("EXPENSE"),
    ...recurrentFor("INVESTMENT"),
    ...recurrentFor("SAVING"),
    ...recurrentFor("DEBT"),
  ],
  STORY_CATEGORIES,
  STORY_CTX
);

function Controlled(props: React.ComponentProps<typeof CancelableItemsList>) {
  const [excluded, setExcluded] = useState(new Set(props.excludedIds));
  const toggle = (id: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <CancelableItemsList
      {...props}
      excludedIds={excluded}
      onToggle={toggle}
      onSelect={(ids) => setExcluded(new Set(ids))}
    />
  );
}

const meta = {
  title: "Organisms/Prospect/CancelableItemsList",
  component: CancelableItemsList,
  tags: ["autodocs"],
  args: {
    groups: GROUPS,
    mode: "whatif",
    excludedIds: new Set<string>(),
    onToggle: fn(),
    onSelect: fn(),
    onMarkEssential: fn(),
    categories: STORY_CATEGORIES,
    currency: "USD",
    loading: false,
  },
  render: (args) => <Controlled {...args} />,
  decorators: [boxed(560)],
} satisfies Meta<typeof CancelableItemsList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Non-essential first, priciest at the top; the chips pick the top 1–3. */
export const Default: Story = {};
export const SomeCancelled: Story = {
  args: { excludedIds: new Set(["rt-netflix", "rt-spotify", "rt-btc"]) },
};
/** Emergency mode: the checks show what the mode pauses, read-only. */
export const Emergency: Story = { args: { mode: "emergency" } };
export const Loading: Story = {
  args: {
    loading: true,
    groups: { nonEssential: [], essential: [], contributions: [], debts: [] },
  },
};
