import auth0 from "../../lib/auth0";
import { OnboardingLayout } from "../../features/onboarding/components/OnboardingLayout";
import { MethodsStep } from "../../features/onboarding/components/MethodsStep";
import { useMethodsStep } from "../../features/onboarding/hooks/useMethodsStep";
import { useStepNavigation } from "../../features/onboarding/hooks/useStepNavigation";
import { WizardActions } from "../../features/onboarding/components/WizardActions";
import { ContinueLater } from "../../features/onboarding/components/ContinueLater";
import { useLeaveOnboarding } from "../../features/onboarding/hooks/useLeaveOnboarding";

export const getServerSideProps = auth0.withPageAuthRequired();

export default function OnboardingMethods() {
  const state = useMethodsStep();
  const { busy, error, flush, go } = useStepNavigation(async () => {
    await state.save();
  }, "Could not save your payment methods. Please try again.");
  const later = useLeaveOnboarding(flush);

  return (
    <OnboardingLayout
      step={2}
      description="How you pay: your cards and accounts, so each plan item knows where it is charged."
      onBack={() => go("/onboarding/categories")}
      onNavigate={go}
      busy={busy || later.leaving}
      footer={
        <WizardActions
          leading={<ContinueLater step={2} onClick={later.leave} busy={busy || later.leaving} />}
          onBack={() => go("/onboarding/categories")}
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
