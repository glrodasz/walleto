import type { Meta, StoryObj } from "@storybook/nextjs";
import { mocked } from "storybook/test";
import { useRouter } from "next/router";
import { OnboardingLayout } from "./OnboardingLayout";
import { IntroPage } from "./IntroPage";
import { CategoriesStep } from "./CategoriesStep";
import { MethodsStep } from "./MethodsStep";
import { RecurrentStep } from "./RecurrentStep";
import { CurrenciesStep } from "./CurrenciesStep";
import { ReviewStep } from "./ReviewStep";
import { WizardActions } from "./WizardActions";
import { ContinueLater } from "./ContinueLater";
import { StepLead } from "./StepLead";
import { useMethodsStep } from "../hooks/useMethodsStep";
import { useCurrenciesStep } from "../hooks/useCurrenciesStep";
import { useReviewStep } from "../hooks/useReviewStep";
import { useRecurrentStep } from "../hooks/useRecurrentStep";
import { useStepNavigation } from "../hooks/useStepNavigation";
import { useLeaveOnboarding } from "../hooks/useLeaveOnboarding";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { at, MOBILE, screen } from "../../../stories/templates";
import { hookDefaults } from "../../../stories/fixtures/hookDefaults";
import { STORY_USER_DOC } from "../../../stories/fixtures/user";

/*
 * The Welcome, the tour and the six wizard pages composed exactly as
 * pages/onboarding/*.tsx do.
 * The page files themselves stay out of Storybook: they're wrapped in the
 * Auth0 client guard. Navigation goes to the
 * Storybook router mock, so "Next" logs an action instead of leaving.
 */

function Categories() {
  const router = useRouter();
  const { leave, leaving, error } = useLeaveOnboarding();
  const go = (href: string) => router.push(href);
  return (
    <OnboardingLayout
      step={1}
      description="Your plan is sorted by category. Keep the defaults or add your own."
      onNavigate={go}
      busy={leaving}
      footer={
        <WizardActions
          leading={<ContinueLater step={1} onClick={leave} busy={leaving} />}
          onNext={() => go("/onboarding/currencies")}
          busy={leaving}
          error={error}
        />
      }
    >
      <CategoriesStep />
    </OnboardingLayout>
  );
}

function Currencies() {
  const state = useCurrenciesStep();
  const { busy, error, flush, go } = useStepNavigation(
    state.save,
    "Could not save your currencies. Please try again."
  );
  const later = useLeaveOnboarding(flush);
  return (
    <OnboardingLayout
      step={2}
      onNavigate={go}
      busy={busy || later.leaving}
      footer={
        <WizardActions
          leading={<ContinueLater step={2} onClick={later.leave} busy={busy || later.leaving} />}
          onBack={() => go("/onboarding/categories")}
          onNext={() => go("/onboarding/methods")}
          busy={busy || later.leaving}
          error={error ?? later.error}
        />
      }
    >
      <StepLead id="currencies" />
      <CurrenciesStep state={state} />
    </OnboardingLayout>
  );
}

function Methods() {
  const state = useMethodsStep();
  const { busy, error, flush, go } = useStepNavigation(async () => {
    await state.save();
  }, "Could not save your payment methods. Please try again.");
  const later = useLeaveOnboarding(flush);
  return (
    <OnboardingLayout
      step={3}
      description="How you pay: your cards and accounts, so each plan item knows where it is charged."
      onNavigate={go}
      busy={busy || later.leaving}
      footer={
        <WizardActions
          leading={<ContinueLater step={3} onClick={later.leave} busy={busy || later.leaving} />}
          onBack={() => go("/onboarding/currencies")}
          onNext={() => go("/onboarding/incomes")}
          busy={busy || later.leaving}
          error={error ?? later.error}
        />
      }
    >
      <MethodsStep state={state} />
    </OnboardingLayout>
  );
}

function Incomes() {
  const { userDoc } = useUserDoc();
  const state = useRecurrentStep("INCOME", userDoc?.mainCurrency ?? "USD");
  const { busy, error, flush, go } = useStepNavigation(async () => {
    await state.save();
  }, "Could not save your income. Please try again.");
  const later = useLeaveOnboarding(flush);
  return (
    <OnboardingLayout
      step={4}
      onNavigate={go}
      busy={busy || later.leaving}
      footer={
        <WizardActions
          leading={<ContinueLater step={4} onClick={later.leave} busy={busy || later.leaving} />}
          onBack={() => go("/onboarding/methods")}
          onNext={() => go("/onboarding/expenses")}
          busy={busy || later.leaving}
          error={error ?? later.error}
        />
      }
    >
      <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <h2 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, color: "var(--fg-1)" }}>
          What do you earn each month?
        </h2>
        <RecurrentStep state={state} />
      </section>
    </OnboardingLayout>
  );
}

function Expenses() {
  const { userDoc } = useUserDoc();
  const state = useRecurrentStep("EXPENSE", userDoc?.mainCurrency ?? "USD");
  const { busy, error, flush, go } = useStepNavigation(async () => {
    await state.save();
  }, "Could not save your expenses. Please try again.");
  const later = useLeaveOnboarding(flush);
  return (
    <OnboardingLayout
      step={5}
      onNavigate={go}
      busy={busy || later.leaving}
      footer={
        <WizardActions
          leading={<ContinueLater step={5} onClick={later.leave} busy={busy || later.leaving} />}
          onBack={() => go("/onboarding/incomes")}
          onNext={() => go("/onboarding/review")}
          busy={busy || later.leaving}
          error={error ?? later.error}
        />
      }
    >
      <StepLead id="essentials" />
      <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <h2 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, color: "var(--fg-1)" }}>
          What do you pay every month?
        </h2>
        <RecurrentStep state={state} showPaymentMethod />
      </section>
    </OnboardingLayout>
  );
}

function Review() {
  const router = useRouter();
  const state = useReviewStep();
  const later = useLeaveOnboarding();
  const go = (href: string) => router.push(href);
  return (
    <OnboardingLayout
      step={6}
      description="Here is your plan as the dashboard will show it. Go back to any step to change it."
      onNavigate={go}
      busy={later.leaving}
      footer={
        <WizardActions
          leading={<ContinueLater step={6} onClick={later.leave} busy={later.leaving} />}
          onBack={() => go("/onboarding/expenses")}
          onNext={() => go("/")}
          nextLabel="Finish"
          busy={later.leaving}
          error={later.error}
        />
      }
    >
      <StepLead id="worth" />
      <ReviewStep state={state} onEdit={go} />
    </OnboardingLayout>
  );
}

const meta = {
  title: "Templates/Onboarding",
  component: Categories,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", ...at("/onboarding/categories") },
  decorators: [screen],
} satisfies Meta<typeof Categories>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A new user, before the wizard (the demo profile is already onboarded). */
const firstRun = () => {
  mocked(useUserDoc).mockReturnValue({
    ...hookDefaults.useUserDoc(),
    userDoc: { ...STORY_USER_DOC, onboardingCompleted: false },
  });
};

/** The one screen before step 1, with the stepper as a preview. */
export const Step0Welcome: Story = {
  render: () => <IntroPage />,
  parameters: at("/onboarding"),
  beforeEach: firstRun,
};
/** Settings › Setup › "Watch the intro": the full tour; Close / Done lead back. */
export const IntroReplay: Story = {
  render: () => <IntroPage />,
  parameters: at("/onboarding", { tour: "1" }),
};
export const MobileWelcome: Story = {
  render: () => <IntroPage />,
  parameters: at("/onboarding"),
  globals: MOBILE,
  beforeEach: firstRun,
};
export const MobileIntroReplay: Story = {
  render: () => <IntroPage />,
  parameters: at("/onboarding", { tour: "1" }),
  globals: MOBILE,
};
export const Step1Categories: Story = {};
export const Step2Currencies: Story = {
  render: () => <Currencies />,
  parameters: at("/onboarding/currencies"),
};
export const Step3Methods: Story = {
  render: () => <Methods />,
  parameters: at("/onboarding/methods"),
};
export const Step4Incomes: Story = {
  render: () => <Incomes />,
  parameters: at("/onboarding/incomes"),
};
export const Step5Expenses: Story = {
  render: () => <Expenses />,
  parameters: at("/onboarding/expenses"),
};
export const Step6Review: Story = {
  render: () => <Review />,
  parameters: at("/onboarding/review"),
};
export const MobileExpenses: Story = {
  render: () => <Expenses />,
  parameters: at("/onboarding/expenses"),
  globals: MOBILE,
};
export const Mobile: Story = {
  render: () => <Methods />,
  parameters: at("/onboarding/methods"),
  globals: MOBILE,
};
export const MobileFirstStep: Story = {
  globals: MOBILE,
};
