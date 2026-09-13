import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { TagsField } from "./TagsField";
import { boxed } from "../../stories/decorators";
import { STORY_TAGS } from "../../stories/fixtures";

function Controlled(props: React.ComponentProps<typeof TagsField>) {
  const [value, setValue] = useState(props.value);
  return <TagsField {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Molecules/TagsField",
  component: TagsField,
  tags: ["autodocs"],
  args: {
    tags: STORY_TAGS,
    value: ["tag-family", "tag-shared"],
    onChange: fn(),
    createTag: fn(async () => "tag-new"),
    onError: fn(),
  },
  render: (args) => <Controlled {...args} />,
  decorators: [boxed(420)],
} satisfies Meta<typeof TagsField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Chips for the picked tags plus an "Add tag" combobox that can create new ones. */
export const Default: Story = {};
export const Empty: Story = { args: { value: [] } };
export const Disabled: Story = { args: { disabled: true } };
