import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { Select } from "./Select";
import { FREQUENCY_LABELS } from "../../constants";

const OPTIONS = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({ value, label }));

const meta = {
  title: "Atoms/Select",
  component: Select,
  tags: ["autodocs"],
  args: { label: "Frequency", options: OPTIONS, defaultValue: "MONTHLY", onValueChange: fn() },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Placeholder: Story = {
  args: { placeholder: "Pick a frequency", defaultValue: "" },
};
/** The header/tool variant: no border, sits on glass. */
export const Flat: Story = { args: { flat: true, label: undefined, "aria-label": "Frequency" } };
export const Disabled: Story = { args: { disabled: true } };
