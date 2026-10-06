import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { OnboardingLayout } from "./OnboardingLayout";
import { WizardActions } from "./WizardActions";
import { Card } from "../../../components/atoms/Card";
import { EmptyState } from "../../../components/atoms/EmptyState";
import { DESKTOP, MOBILE, TABLET } from "../../../stories/templates";

const meta = {
  title: "Organisms/Onboarding/OnboardingLayout",
  component: OnboardingLayout,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  // Wide enough for the intro to sit beside the step.
  globals: DESKTOP,
  args: {
    step: 2,
    description:
      "How you pay: your cards and accounts, so each plan item knows where it is charged.",
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

/** The wizard shell: the step's intro beside the stepper, description, body and footer. */
export const StepTwo: Story = {};
export const StepOne: Story = {
  args: { step: 1, description: "Your plan is sorted by category." },
};
export const LastStep: Story = {
  args: { step: 6, description: "Here is your plan as the dashboard will show it." },
};
/** A domain step: its tab and the progress fill take the domain colour. */
export const ExpensesStep: Story = { args: { step: 5 } };
/** Saving: the stepper locks. */
export const Busy: Story = {
  args: { busy: true, footer: <WizardActions onBack={fn()} onNext={fn()} busy /> },
};
/** Without onNavigate the stepper is display-only. */
export const DisplayOnlyStepper: Story = { args: { onNavigate: undefined } };
/** Below 1200px one column: the intro's text above the step. */
export const Tablet: Story = { globals: TABLET };
export const Mobile: Story = { globals: MOBILE };
/** No step but an intro: the Welcome's shell, with no stepper. */
export const Welcome: Story = {
  args: {
    step: undefined,
    intro: "planner",
    title: "Welcome",
    description: undefined,
    onNavigate: undefined,
    footer: <WizardActions onNext={fn()} nextLabel="Start setup" />,
  },
};
/** Neither step nor intro: just the shell (title, body, footer). */
export const NoAside: Story = {
  args: {
    step: undefined,
    title: "Welcome",
    description: undefined,
    footer: <WizardActions onNext={fn()} />,
  },
};
