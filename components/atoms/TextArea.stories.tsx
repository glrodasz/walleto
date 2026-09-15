import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { TextArea } from "./TextArea";

const meta = {
  title: "Atoms/TextArea",
  component: TextArea,
  tags: ["autodocs"],
  args: {
    label: "Note",
    placeholder: "Anything worth remembering about this item",
    onValueChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Filled: Story = {
  args: { defaultValue: "Ends next spring. Extra payment allowed once a year." },
};
export const Tall: Story = { args: { rows: 6 } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "Read only" } };
