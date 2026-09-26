import type { Meta, StoryObj } from "@storybook/nextjs";
import Privacy from "../../pages/privacy";
import { at, MOBILE, screen } from "../templates";

/** The public privacy policy: no auth, no shell, reachable while signed out. */
const meta = {
  title: "Templates/Privacy",
  component: Privacy,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", ...at("/privacy") },
  decorators: [screen],
} satisfies Meta<typeof Privacy>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Mobile: Story = { globals: MOBILE };
