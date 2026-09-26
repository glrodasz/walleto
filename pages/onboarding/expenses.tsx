import { useState } from "react";
import { useRouter } from "next/router";
import auth0 from "../../lib/auth0";
import { OnboardingLayout } from "../../features/onboarding/components/OnboardingLayout";
import { RecurrentStep } from "../../features/onboarding/components/RecurrentStep";
import { useRecurrentStep } from "../../features/onboarding/hooks/useRecurrentStep";
import { useStepNavigation } from "../../features/onboarding/hooks/useStepNavigation";
import { WizardActions } from "../../features/onboarding/components/WizardActions";
import { ContinueLater } from "../../features/onboarding/components/ContinueLater";
import { useLeaveOnboarding } from "../../features/onboarding/hooks/useLeaveOnboarding";
import { useUserDoc } from "../../hooks/useUserDoc";
import { materializeNow } from "../../hooks/useMaterialize";

export const getServerSideProps = auth0.withPageAuthRequired();

export default function OnboardingExpenses() {
  const router = useRouter();
  const { userDoc, update } = useUserDoc();
  const state = useRecurrentStep("EXPENSE", userDoc?.mainCurrency ?? "USD");
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const { busy, error, flush, go } = useStepNavigation(async () => {
    await state.save();
  }, "Could not save your expenses. Please try again.");
  const later = useLeaveOnboarding(flush);
  const pending = busy || finishing || later.leaving;

  const complete = async () => {
    if (!(await flush())) return;
    setFinishing(true);
    setFinishError(null);
    try {
      await update({ onboardingCompleted: true, onboardingMode: "ASSISTED" });
      // Backfilled items were saved with a startDate in the past; write their
      // history now so the dashboard isn't empty until a later session.
      await materializeNow().catch((err) => console.error("materialize failed:", err));
      router.push("/");
    } catch (err) {
      console.error("Failed to finish onboarding:", err);
      setFinishError("Could not finish setup. Please try again.");
      setFinishing(false);
    }
  };

  return (
    <OnboardingLayout
      step={4}
      onBack={() => go("/onboarding/incomes")}
      onNavigate={go}
      busy={pending}
      footer={
        <WizardActions
          leading={<ContinueLater step={4} onClick={later.leave} busy={pending} />}
          onBack={() => go("/onboarding/incomes")}
          onNext={complete}
          nextLabel="Finish"
          busy={pending}
          error={error ?? finishError ?? later.error}
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
