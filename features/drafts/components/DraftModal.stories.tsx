import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { DraftModal } from "./DraftModal";
import { MOBILE } from "../../../stories/templates";

/** "Add draft" from the + sheet: a name, and if known an amount, how often and when. */
const meta = {
  title: "Organisms/Drafts/DraftModal",
  component: DraftModal,
  tags: ["autodocs"],
  args: { open: true, onClose: fn() },
} satisfies Meta<typeof DraftModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Mobile: Story = { globals: MOBILE };
