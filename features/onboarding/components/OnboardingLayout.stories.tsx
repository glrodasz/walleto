import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { OnboardingLayout } from "./OnboardingLayout";
import { WizardActions } from "./WizardActions";
import { Card } from "../../../components/atoms/Card";
import { EmptyState } from "../../../components/atoms/EmptyState";

const meta = {
  title: "Organisms/Onboarding/OnboardingLayout",
  component: OnboardingLayout,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    step: 2,
    description:
      "How you pay: your cards and accounts, so each plan item knows where it is charged.",
    onBack: fn(),
    onNavigate: fn(),
    footer: <WizardActions onBack={fn()} onNext={fn()} />,
    children: (
      <Card>
        <EmptyState title="Step content" description="The step's form goes here." />
      </Card>
    ),
  },
} satisfies Meta<typeof OnboardingLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The wizard shell: stepper with progress, a description, the body and a footer. */
export const StepTwo: Story = {};
export const StepOne: Story = {
  args: { step: 1, description: "Your plan is sorted by category." },
};
export const LastStep: Story = { args: { step: 4, description: "What do you pay every month?" } };
/** Saving: the stepper locks. */
export const Busy: Story = {
  args: { busy: true, footer: <WizardActions onBack={fn()} onNext={fn()} busy /> },
};
/** Without onNavigate the stepper is display-only. */
export const DisplayOnlyStepper: Story = { args: { onNavigate: undefined } };
export const Mobile: Story = { globals: { viewport: { value: "mobile1", isRotated: false } } };
