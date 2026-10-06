import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { OnboardingLayout } from "../../features/onboarding/components/OnboardingLayout";
import { RecurrentStep } from "../../features/onboarding/components/RecurrentStep";
import { useRecurrentStep } from "../../features/onboarding/hooks/useRecurrentStep";
import { useStepNavigation } from "../../features/onboarding/hooks/useStepNavigation";
import { WizardActions } from "../../features/onboarding/components/WizardActions";
import { ContinueLater } from "../../features/onboarding/components/ContinueLater";
import { useLeaveOnboarding } from "../../features/onboarding/hooks/useLeaveOnboarding";
import { useUserDoc } from "../../hooks/useUserDoc";

// Auth is checked on the client, not in getServerSideProps: with a server
// guard every Next/Back became a serverless round trip (often a cold start)
// before the next step could render. Static pages switch instantly, and the
// data is still guarded by Firestore rules and the API routes.
function OnboardingExpenses() {
  const { userDoc } = useUserDoc();
  const state = useRecurrentStep("EXPENSE", userDoc?.mainCurrency ?? "USD");

  const { busy, error, flush, go } = useStepNavigation(async () => {
    await state.save();
  }, "Could not save your expenses. Please try again.");
  const later = useLeaveOnboarding(flush);
  const pending = busy || later.leaving;

  return (
    <OnboardingLayout
      step={5}
      onNavigate={go}
      busy={pending}
      footer={
        <WizardActions
          leading={<ContinueLater step={5} onClick={later.leave} busy={pending} />}
          onBack={() => go("/onboarding/incomes")}
          onNext={() => go("/onboarding/review")}
          busy={pending}
          error={error ?? later.error}
        />
      }
    >
      <section className="expenses">
        <h2 className="heading">What do you pay every month?</h2>
        <RecurrentStep state={state} showPaymentMethod />
      </section>

      <style jsx>{`
        .expenses {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .heading {
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--fg-1);
        }
      `}</style>
    </OnboardingLayout>
  );
}

export default withPageAuthRequired(OnboardingExpenses);
