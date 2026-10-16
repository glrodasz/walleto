import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { OnboardingLayout } from "../../features/onboarding/components/OnboardingLayout";
import { stepNav } from "../../features/onboarding/helpers/stepNav";
import { MethodsStep } from "../../features/onboarding/components/MethodsStep";
import { useMethodsStep } from "../../features/onboarding/hooks/useMethodsStep";
import { useStepNavigation } from "../../features/onboarding/hooks/useStepNavigation";
import { WizardActions } from "../../features/onboarding/components/WizardActions";
import { ContinueLater } from "../../features/onboarding/components/ContinueLater";
import { useLeaveOnboarding } from "../../features/onboarding/hooks/useLeaveOnboarding";
import { useT } from "../../hooks/useT";
import { PAGE_MESSAGES } from "../../messages/pages";

const { step, back, next } = stepNav("methods");

// Auth is checked on the client, not in getServerSideProps: with a server
// guard every Next/Back became a serverless round trip (often a cold start)
// before the next step could render. Static pages switch instantly, and the
// data is still guarded by Firestore rules and the API routes.
function OnboardingMethods() {
  const t = useT(PAGE_MESSAGES);
  const state = useMethodsStep();
  const { busy, error, flush, go } = useStepNavigation(async () => {
    await state.save();
  }, t("onboarding.methods.saveFailed"));
  const later = useLeaveOnboarding(flush);

  return (
    <OnboardingLayout
      step={step}
      description={t("onboarding.methods.description")}
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

export default withPageAuthRequired(OnboardingMethods);
