import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { SettingsRow } from "./SettingsRow";
import { Select } from "../../../components/atoms/Select";
import { Card } from "../../../components/atoms/Card";
import { boxed } from "../../../stories/decorators";

const meta = {
  title: "Organisms/Settings/SettingsRow",
  component: SettingsRow,
  tags: ["autodocs"],
  args: { label: "Main currency", value: "USD" },
  decorators: [
    (Story) => (
      <Card>
        <Story />
      </Card>
    ),
    boxed(480),
  ],
} satisfies Meta<typeof SettingsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnly: Story = {};
export const WithHint: Story = { args: { hint: "Everything is reported in this currency." } };
export const WithControl: Story = {
  args: {
    value: undefined,
    control: (
      <Select
        flat
        aria-label="Main currency"
        options={[
          { value: "USD", label: "USD" },
          { value: "EUR", label: "EUR" },
        ]}
        defaultValue="USD"
      />
    ),
  },
};
/** Background behind an "i" beside the label, instead of grey text after the control. */
export const WithInfo: Story = {
  args: {
    label: "Decimal separator",
    value: undefined,
    control: (
      <Select
        aria-label="Decimal separator"
        options={[
          { value: ".", label: "Point (1,234.56)" },
          { value: ",", label: "Comma (1.234,56)" },
        ]}
        defaultValue="."
      />
    ),
    info: "Typing accepts either key; this is how numbers are written back.",
  },
};
export const Clickable: Story = {
  args: { label: "Run setup again", value: undefined, onClick: fn() },
};
export const ExternalLink: Story = {
  args: { label: "Change password", value: undefined, href: "https://example.com/account" },
};
export const Danger: Story = {
  args: { label: "Delete all my data", value: undefined, onClick: fn(), danger: true },
};
