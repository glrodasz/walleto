import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { EditorFooter } from "./EditorFooter";
import { boxed } from "../../stories/decorators";
import { MOBILE } from "../../stories/templates";

/**
 * The action row at the bottom of an editable item: `Remove | Done`, right
 * aligned. Remove is never an icon-only × beside the fields.
 */
const meta = {
  title: "Molecules/EditorFooter",
  component: EditorFooter,
  tags: ["autodocs"],
  decorators: [boxed(560)],
  args: { onRemove: fn(), removeLabel: "Remove Chase Sapphire", onDone: fn() },
} satisfies Meta<typeof EditorFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A collapsible editor (a payment method): remove it, or close it. */
export const RemoveAndDone: Story = {};
/** An always-open editor (an Income / Expenses row): only Remove. */
export const RemoveOnly: Story = { args: { onDone: undefined, removeLabel: "Remove Rent" } };
/** Nothing to remove yet (the only, still-blank item). */
export const DoneOnly: Story = { args: { onRemove: undefined } };
export const Mobile: Story = { globals: MOBILE };
