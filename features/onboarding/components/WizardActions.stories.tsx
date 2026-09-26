import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { WizardActions } from "./WizardActions";
import { ContinueLater } from "./ContinueLater";

const meta = {
  title: "Organisms/Onboarding/WizardActions",
  component: WizardActions,
  tags: ["autodocs"],
  args: { onBack: fn(), onNext: fn() },
} satisfies Meta<typeof WizardActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const FirstStep: Story = { args: { onBack: undefined } };
export const Finish: Story = { args: { nextLabel: "Finish setup" } };
export const Busy: Story = { args: { busy: true } };
export const WithError: Story = {
  args: { error: "Could not save your income. Please try again." },
};
export const WithContinueLater: Story = {
  args: { leading: <ContinueLater step={2} onClick={fn()} /> },
};
