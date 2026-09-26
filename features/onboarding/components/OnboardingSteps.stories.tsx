import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useRouter } from "next/router";
import { OnboardingLayout } from "./OnboardingLayout";
import { CategoriesStep } from "./CategoriesStep";
import { MethodsStep } from "./MethodsStep";
import { RecurrentStep } from "./RecurrentStep";
import { CurrencyPicker } from "./CurrencyPicker";
import { WizardActions } from "./WizardActions";
import { useMethodsStep } from "../hooks/useMethodsStep";
import { useRecurrentStep } from "../hooks/useRecurrentStep";
import { useStepNavigation } from "../hooks/useStepNavigation";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { at, MOBILE, screen } from "../../../stories/templates";
import type { Currency } from "../../../types";

/*
 * The four wizard pages composed exactly as pages/onboarding/*.tsx do.
 * The page files themselves stay out of Storybook: they export
 * getServerSideProps with server-only imports. Navigation goes to the
 * Storybook router mock, so "Next" logs an action instead of leaving.
 */

function Categories() {
  const router = useRouter();
  const { update } = useUserDoc();
  const [busy, setBusy] = useState(false);
  const skip = async () => {
    setBusy(true);
    try {
      await update({ onboardingCompleted: true });
      router.push("/");
    } finally {
      setBusy(false);
    }
  };
  const go = (href: string) => router.push(href);
  return (
    <OnboardingLayout
      step={1}
      description="Your plan is sorted by category. Keep the defaults or add your own."
      onNavigate={go}
      busy={busy}
      footer={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            width: "100%",
          }}
        >
          <button
            type="button"
            onClick={skip}
            disabled={busy}
            style={{
              border: "none",
              background: "none",
              color: "var(--fg-2)",
              textDecoration: "underline",
              cursor: "pointer",
              font: "inherit",
              fontSize: "0.875rem",
            }}
          >
            Skip for now
          </button>
          <WizardActions onNext={() => go("/onboarding/methods")} busy={busy} />
        </div>
      }
    >
      <CategoriesStep />
    </OnboardingLayout>
  );
}

function Methods() {
  const state = useMethodsStep();
  const { busy, error, go } = useStepNavigation(async () => {
    await state.save();
  }, "Could not save your payment methods. Please try again.");
  return (
    <OnboardingLayout
      step={2}
      description="How you pay: your cards and accounts, so each plan item knows where it is charged."
      onBack={() => go("/onboarding/categories")}
      onNavigate={go}
      busy={busy}
      footer={
        <WizardActions
          onBack={() => go("/onboarding/categories")}
          onNext={() => go("/onboarding/incomes")}
          busy={busy}
          error={error}
        />
      }
    >
      <MethodsStep state={state} />
    </OnboardingLayout>
  );
}

function Incomes() {
  const { userDoc, update } = useUserDoc();
  const [currency, setCurrency] = useState<Currency>("USD");
  const [touched, setTouched] = useState(false);
  const state = useRecurrentStep("INCOME", currency);
  useEffect(() => {
    if (!touched && userDoc?.mainCurrency) setCurrency(userDoc.mainCurrency);
  }, [userDoc?.mainCurrency, touched]);
  const { busy, error, go } = useStepNavigation(async () => {
    if (currency !== userDoc?.mainCurrency) await update({ mainCurrency: currency });
    await state.save();
  }, "Could not save your income. Please try again.");
  return (
    <OnboardingLayout
      step={3}
      onBack={() => go("/onboarding/methods")}
      onNavigate={go}
      busy={busy}
      footer={
        <WizardActions
          onBack={() => go("/onboarding/methods")}
          onNext={() => go("/onboarding/expenses")}
          busy={busy}
          error={error}
        />
      }
    >
      <CurrencyPicker
        value={currency}
        onChange={(next) => {
          setTouched(true);
          setCurrency(next);
        }}
      />
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
  const { busy, error, go } = useStepNavigation(async () => {
    await state.save();
  }, "Could not save your expenses. Please try again.");
  return (
    <OnboardingLayout
      step={4}
      description="What do you pay every month?"
      onBack={() => go("/onboarding/incomes")}
      onNavigate={go}
      busy={busy}
      footer={
        <WizardActions
          onBack={() => go("/onboarding/incomes")}
          onNext={() => go("/")}
          nextLabel="Finish setup"
          busy={busy}
          error={error}
        />
      }
    >
      <RecurrentStep state={state} showPaymentMethod />
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

export const Step1Categories: Story = {};
export const Step2Methods: Story = {
  render: () => <Methods />,
  parameters: at("/onboarding/methods"),
};
export const Step3Incomes: Story = {
  render: () => <Incomes />,
  parameters: at("/onboarding/incomes"),
};
export const Step4Expenses: Story = {
  render: () => <Expenses />,
  parameters: at("/onboarding/expenses"),
};
export const Mobile: Story = {
  render: () => <Methods />,
  parameters: at("/onboarding/methods"),
  globals: MOBILE,
};
