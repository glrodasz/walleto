import { useState } from "react";
import { useRouter } from "next/router";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { OnboardingLayout } from "../../features/onboarding/components/OnboardingLayout";
import { ReviewStep } from "../../features/onboarding/components/ReviewStep";
import { StepLead } from "../../features/onboarding/components/StepLead";
import { useReviewStep } from "../../features/onboarding/hooks/useReviewStep";
import { WizardActions } from "../../features/onboarding/components/WizardActions";
import { ContinueLater } from "../../features/onboarding/components/ContinueLater";
import { useLeaveOnboarding } from "../../features/onboarding/hooks/useLeaveOnboarding";
import { useUserDoc } from "../../hooks/useUserDoc";
import { materializeNow } from "../../hooks/useMaterialize";

// Auth is checked on the client, not in getServerSideProps: with a server
// guard every Next/Back became a serverless round trip (often a cold start)
// before the next step could render. Static pages switch instantly, and the
// data is still guarded by Firestore rules and the API routes.
function OnboardingReview() {
  const router = useRouter();
  const { update } = useUserDoc();
  const state = useReviewStep();
  // Nothing is edited here: every step saved on the way in.
  const later = useLeaveOnboarding();
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const pending = finishing || later.leaving;
  const go = (href: string) => router.push(href);

  const complete = async () => {
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
      step={6}
      description="Here is your plan as the dashboard will show it. Go back to any step to change it."
      onNavigate={go}
      busy={pending}
      footer={
        <WizardActions
          leading={<ContinueLater step={6} onClick={later.leave} busy={pending} />}
          onBack={() => go("/onboarding/expenses")}
          onNext={complete}
          nextLabel="Finish"
          busy={pending}
          error={finishError ?? later.error}
        />
      }
    >
      <StepLead id="worth" />
      <ReviewStep state={state} onEdit={go} />
    </OnboardingLayout>
  );
}

export default withPageAuthRequired(OnboardingReview);
