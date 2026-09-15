import type { Meta, StoryObj } from "@storybook/nextjs";
import LoginError from "../../pages/login-error";
import { at, MOBILE, screen } from "../templates";

/** The one page with no providers and no shell: what Auth0 sends a failed sign-in to. */
const meta = {
  title: "Templates/Login error",
  component: LoginError,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", ...at("/login-error") },
  decorators: [screen],
} satisfies Meta<typeof LoginError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithReason: Story = {
  parameters: at("/login-error", { reason: "callback_url_not_allowed" }),
};
export const Mobile: Story = { globals: MOBILE };
