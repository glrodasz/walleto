import type { Meta, StoryObj } from "@storybook/nextjs";
import { SettingsPage } from "./SettingsPage";
import { at, MOBILE, screen, withHash } from "../../../stories/templates";

/** Settings with its five sections; the active one lives in the URL hash. */
const meta = {
  title: "Templates/Settings",
  component: SettingsPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", ...at("/settings") },
  decorators: [screen],
  beforeEach: withHash(""),
} satisfies Meta<typeof SettingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const General: Story = {};
export const Categories: Story = { beforeEach: withHash("categories") };
export const Tags: Story = { beforeEach: withHash("tags") };
export const PaymentMethods: Story = { beforeEach: withHash("methods") };
export const AccountsAndPockets: Story = { beforeEach: withHash("accounts") };
export const Mobile: Story = { globals: MOBILE };
