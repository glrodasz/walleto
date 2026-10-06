import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { OnboardingLayout } from "../../features/onboarding/components/OnboardingLayout";
import { stepNav } from "../../features/onboarding/helpers/stepNav";
import { CurrenciesStep } from "../../features/onboarding/components/CurrenciesStep";
import { useCurrenciesStep } from "../../features/onboarding/hooks/useCurrenciesStep";
import { useStepNavigation } from "../../features/onboarding/hooks/useStepNavigation";
import { WizardActions } from "../../features/onboarding/components/WizardActions";
import { ContinueLater } from "../../features/onboarding/components/ContinueLater";
import { useLeaveOnboarding } from "../../features/onboarding/hooks/useLeaveOnboarding";

const { step, back, next } = stepNav("currencies");

// Auth is checked on the client, not in getServerSideProps: with a server
// guard every Next/Back became a serverless round trip (often a cold start)
// before the next step could render. Static pages switch instantly, and the
// data is still guarded by Firestore rules and the API routes.
function OnboardingCurrencies() {
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

export default withPageAuthRequired(OnboardingCurrencies);
