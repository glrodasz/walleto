import { useRouter } from "next/router";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { OnboardingLayout } from "../../features/onboarding/components/OnboardingLayout";
import { CategoriesStep } from "../../features/onboarding/components/CategoriesStep";
import { WizardActions } from "../../features/onboarding/components/WizardActions";
import { ContinueLater } from "../../features/onboarding/components/ContinueLater";
import { useLeaveOnboarding } from "../../features/onboarding/hooks/useLeaveOnboarding";

// Auth is checked on the client, not in getServerSideProps: with a server
// guard every Next/Back became a serverless round trip (often a cold start)
// before the next step could render. Static pages switch instantly, and the
// data is still guarded by Firestore rules and the API routes.
function OnboardingCategories() {
  const router = useRouter();
  // Categories persist as they're created, so there is nothing to flush.
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

export default withPageAuthRequired(OnboardingCategories);
