import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { MethodsList } from "./MethodsList";
import { column } from "../../../stories/decorators";
import { STORY_PAYMENT_METHODS } from "../../../stories/fixtures";

const meta = {
  title: "Organisms/Methods/MethodsList",
  component: MethodsList,
  tags: ["autodocs"],
  args: {
    methods: STORY_PAYMENT_METHODS,
    loading: false,
    archivingId: null,
    onEdit: fn(),
    onArchive: fn(),
  },
  decorators: [column],
} satisfies Meta<typeof MethodsList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Cards, wallets and cash grouped by type. */
export const Default: Story = {};
export const Archiving: Story = { args: { archivingId: "pm-nu" } };
export const Loading: Story = { args: { loading: true, methods: [] } };
export const Empty: Story = { args: { methods: [] } };
