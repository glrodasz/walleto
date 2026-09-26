import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { ContinueLater } from "./ContinueLater";

const meta = {
  title: "Organisms/Onboarding/ContinueLater",
  component: ContinueLater,
  tags: ["autodocs"],
  args: { step: 2, onClick: fn() },
  decorators: [
    (Story) => (
      <div style={{ paddingTop: 140 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContinueLater>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ContinueLaterStep: Story = {};
export const FirstStep: Story = { args: { step: 1 } };
export const Busy: Story = { args: { busy: true } };
