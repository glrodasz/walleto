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
export const Clickable: Story = {
  args: { label: "Redo onboarding", value: undefined, onClick: fn() },
};
export const ExternalLink: Story = {
  args: { label: "Change password", value: undefined, href: "https://example.com/account" },
};
export const Danger: Story = {
  args: { label: "Delete all my data", value: undefined, onClick: fn(), danger: true },
};
