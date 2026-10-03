import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { CheckboxField } from "./CheckboxField";
import { Badge } from "./Badge";
import { boxed } from "../../stories/decorators";

const meta = {
  title: "Atoms/CheckboxField",
  component: CheckboxField,
  tags: ["autodocs"],
  args: {
    label: "Also update the existing payments of this item",
    hint: "Payments you edited by hand get overwritten.",
    checked: false,
    onChange: fn(),
  },
  decorators: [boxed(420)],
} satisfies Meta<typeof CheckboxField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Label first, the consequence underneath. */
export const WithHint: Story = {};
export const LabelOnly: Story = {
  args: { label: "Apply the tags to each payment", hint: undefined },
};
/** A status pill under the hint — here, a value the app guessed. */
export const WithTag: Story = {
  args: {
    label: "Essential",
    hint: "Keep paying it in Prospect’s emergency mode.",
    tag: (
      <Badge variant="outline" caps>
        Guessed from category
      </Badge>
    ),
    checked: true,
  },
};
export const Disabled: Story = { args: { disabled: true, checked: true } };
