import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { CheckboxField } from "./CheckboxField";
import { Badge } from "./Badge";
import { InfoTip } from "./InfoTip";
import { Info } from "./Icons";
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
/** A status pill beside the label — here, a guess that explains itself on hover or tap. */
export const WithTag: Story = {
  args: {
    label: "Essential",
    hint: "Keep paying it in Prospect’s emergency mode.",
    tag: (
      <InfoTip
        label="Guessed from category: why?"
        trigger={
          <Badge variant="outline" caps size="sm" icon={<Info size={10} />}>
            Guessed from category
          </Badge>
        }
      >
        Ticked automatically: items in this category usually keep being paid in an emergency. It
        comes from the category this item belongs to — tick or untick the box to decide yourself,
        and your choice overrides the guess.
      </InfoTip>
    ),
    checked: true,
  },
  // Room above for the tooltip, which opens upwards.
  decorators: [(Story) => <div style={{ paddingTop: 140 }}>{Story()}</div>],
};
export const Disabled: Story = { args: { disabled: true, checked: true } };
