import type { Meta, StoryObj } from "@storybook/nextjs";
import { mocked } from "storybook/test";
import { ProspectPage } from "./ProspectPage";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { hookDefaults, loadingState } from "../../../stories/fixtures/hookDefaults";
import { at, MOBILE, screen } from "../../../stories/templates";

/** The what-if simulator: tick items to cancel and see the projected net. */
const meta = {
  title: "Templates/Prospect",
  component: ProspectPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", ...at("/prospect") },
  decorators: [screen],
} satisfies Meta<typeof ProspectPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Loading: Story = {
  beforeEach: () => {
    mocked(useRecurrentTransactions).mockImplementation((d) => ({
      ...hookDefaults.useRecurrentTransactions(d),
      items: [],
      ...loadingState,
    }));
  },
};
export const Mobile: Story = { globals: MOBILE };
