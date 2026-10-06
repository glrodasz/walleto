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
import { useMethodsStep } from "../hooks/useMethodsStep";
import { useCurrenciesStep } from "../hooks/useCurrenciesStep";
import { useReviewStep } from "../hooks/useReviewStep";
import { useRecurrentStep } from "../hooks/useRecurrentStep";
import { useStepNavigation } from "../hooks/useStepNavigation";
import { useLeaveOnboarding } from "../hooks/useLeaveOnboarding";
import { stepNav } from "../helpers/stepNav";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { at, DESKTOP, MOBILE, TABLET, screen } from "../../../stories/templates";
import { hookDefaults } from "../../../stories/fixtures/hookDefaults";
import { STORY_USER_DOC } from "../../../stories/fixtures/user";

/*
 * The Welcome and the six wizard pages composed exactly as pages/onboarding/*.tsx
 * do: each screen's intro slide beside its step from 1200px, its text above
 * the step below that.
 * The page files themselves stay out of Storybook: they're wrapped in the
 * Auth0 client guard. Navigation goes to the
 * Storybook router mock, so "Next" logs an action instead of leaving.
 */

function Categories() {
  const { step, next } = stepNav("categories");
  const router = useRouter();
  const { leave, leaving, error } = useLeaveOnboarding();
  const go = (href: string) => router.push(href);
  return (
    <OnboardingLayout
      step={step}
      description="Your plan is sorted by category. Keep the defaults or add your own."
      onNavigate={go}
      busy={leaving}
      footer={
        <WizardActions
          leading={<ContinueLater step={step} onClick={leave} busy={leaving} />}
          onNext={() => next && go(next)}
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
  const { step, back, next } = stepNav("currencies");
  const state = useCurrenciesStep();
  const { busy, error, flush, go } = useStepNavigation(
    state.save,
    "Could not save your currencies. Please try again."
  );
  const later = useLeaveOnboarding(flush);
  return (
    <OnboardingLayout
      step={step}
      onNavigate={go}
      busy={busy || later.leaving}
      footer={
        <WizardActions
          leading={<ContinueLater step={step} onClick={later.leave} busy={busy || later.leaving} />}
          onBack={back ? () => go(back) : undefined}
          onNext={() => next && go(next)}
          busy={busy || later.leaving}
          error={error ?? later.error}
        />
      }
    >
      <CurrenciesStep state={state} />
    </OnboardingLayout>
  );
}

function Methods() {
  const { step, back, next } = stepNav("methods");
  const state = useMethodsStep();
  const { busy, error, flush, go } = useStepNavigation(async () => {
    await state.save();
  }, "Could not save your payment methods. Please try again.");
  const later = useLeaveOnboarding(flush);
  return (
    <OnboardingLayout
      step={step}
      description="How you pay: your cards and accounts, so each plan item knows where it is charged."
      onNavigate={go}
      busy={busy || later.leaving}
      footer={
        <WizardActions
          leading={<ContinueLater step={step} onClick={later.leave} busy={busy || later.leaving} />}
          onBack={back ? () => go(back) : undefined}
          onNext={() => next && go(next)}
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
  const { step, back, next } = stepNav("incomes");
  const { userDoc } = useUserDoc();
  const state = useRecurrentStep("INCOME", userDoc?.mainCurrency ?? "USD");
  const { busy, error, flush, go } = useStepNavigation(async () => {
    await state.save();
  }, "Could not save your income. Please try again.");
  const later = useLeaveOnboarding(flush);
  return (
    <OnboardingLayout
      step={step}
      onNavigate={go}
      busy={busy || later.leaving}
      footer={
        <WizardActions
          leading={<ContinueLater step={step} onClick={later.leave} busy={busy || later.leaving} />}
          onBack={back ? () => go(back) : undefined}
          onNext={() => next && go(next)}
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
  const { step, back, next } = stepNav("expenses");
  const { userDoc } = useUserDoc();
  const state = useRecurrentStep("EXPENSE", userDoc?.mainCurrency ?? "USD");
  const { busy, error, flush, go } = useStepNavigation(async () => {
    await state.save();
  }, "Could not save your expenses. Please try again.");
  const later = useLeaveOnboarding(flush);
  return (
    <OnboardingLayout
      step={step}
      onNavigate={go}
      busy={busy || later.leaving}
      footer={
        <WizardActions
          leading={<ContinueLater step={step} onClick={later.leave} busy={busy || later.leaving} />}
          onBack={back ? () => go(back) : undefined}
          onNext={() => next && go(next)}
          busy={busy || later.leaving}
          error={error ?? later.error}
        />
      }
    >
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
  const { step, back } = stepNav("review");
  const router = useRouter();
  const state = useReviewStep();
  const later = useLeaveOnboarding();
  const go = (href: string) => router.push(href);
  return (
    <OnboardingLayout
      step={step}
      description="Here is your plan as the dashboard will show it. Go back to any step to change it."
      onNavigate={go}
      busy={later.leaving}
      footer={
        <WizardActions
          leading={<ContinueLater step={step} onClick={later.leave} busy={later.leaving} />}
          onBack={back ? () => go(back) : undefined}
          onNext={() => go("/")}
          nextLabel="Finish"
          busy={later.leaving}
          error={later.error}
        />
      }
    >
      <ReviewStep state={state} onEdit={go} />
    </OnboardingLayout>
  );
}

const meta = {
  title: "Templates/Onboarding",
  component: Categories,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", ...at("/onboarding/categories") },
  // Wide enough for the intro to sit beside each step.
  globals: DESKTOP,
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

/** The one screen before step 1: what Walleto is, beside what the setup covers. */
export const Step0Welcome: Story = {
  render: () => <IntroPage />,
  parameters: at("/onboarding"),
  beforeEach: firstRun,
};
export const Step1Categories: Story = {};
export const Step2Methods: Story = {
  render: () => <Methods />,
  parameters: at("/onboarding/methods"),
};
export const Step3Currencies: Story = {
  render: () => <Currencies />,
  parameters: at("/onboarding/currencies"),
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
/** Below 1200px: one column, each slide's text above its step. */
export const TabletCurrencies: Story = {
  render: () => <Currencies />,
  parameters: at("/onboarding/currencies"),
  globals: TABLET,
};
/** Stacked, the Welcome keeps its scene: there's no form under it. */
export const MobileWelcome: Story = {
  render: () => <IntroPage />,
  parameters: at("/onboarding"),
  globals: MOBILE,
  beforeEach: firstRun,
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
