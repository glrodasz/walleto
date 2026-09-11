import auth0 from "../../lib/auth0";
import { OnboardingLayout } from "../../features/onboarding/components/OnboardingLayout";
import { MethodsStep } from "../../features/onboarding/components/MethodsStep";
import { useMethodsStep } from "../../features/onboarding/hooks/useMethodsStep";
import { useStepNavigation } from "../../features/onboarding/hooks/useStepNavigation";
import { WizardActions } from "../../features/onboarding/components/WizardActions";

export const getServerSideProps = auth0.withPageAuthRequired();

export default function OnboardingMethods() {
  const state = useMethodsStep();
  const { busy, error, go } = useStepNavigation(async () => {
    await state.save();
  }, "Could not save your payment methods. Please try again.");

  return (
    <OnboardingLayout
      step={2}
      description="Add your main payment methods"
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
