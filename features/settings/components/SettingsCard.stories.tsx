import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";
import { Button } from "../../../components/atoms/Button";
import { Select } from "../../../components/atoms/Select";
import { Sliders, User } from "../../../components/atoms/Icons";
import { boxed } from "../../../stories/decorators";

const meta = {
  title: "Organisms/Settings/SettingsCard",
  component: SettingsCard,
  tags: ["autodocs"],
  args: {
    title: "Preferences",
    subtitle: "How dates and weeks are shown",
    icon: Sliders,
    children: (
      <>
        <SettingsRow
          label="Date format"
          control={
            <Select
              flat
              aria-label="Date format"
              options={[
                { value: "MDY", label: "Sep 6" },
                { value: "DMY", label: "6 Sep" },
              ]}
              defaultValue="MDY"
            />
          }
        />
        <SettingsRow
          label="Week starts on"
          value="Monday"
          hint="Affects the weekly buckets in charts."
        />
      </>
    ),
  },
  decorators: [boxed(480)],
} satisfies Meta<typeof SettingsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithAction: Story = {
  args: {
    title: "Account",
    subtitle: "Signed in with Auth0",
    icon: User,
    action: (
      <Button size="sm" variant="secondary" onClick={fn()}>
        Manage
      </Button>
    ),
    children: <SettingsRow label="Email" value="ada@example.com" />,
  },
};
