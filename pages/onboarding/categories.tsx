import { useRouter } from "next/router";
import auth0 from "../../lib/auth0";
import { OnboardingLayout } from "../../features/onboarding/components/OnboardingLayout";
import { CategoriesStep } from "../../features/onboarding/components/CategoriesStep";
import { WizardActions } from "../../features/onboarding/components/WizardActions";
import { ContinueLater } from "../../features/onboarding/components/ContinueLater";
import { useLeaveOnboarding } from "../../features/onboarding/hooks/useLeaveOnboarding";

export const getServerSideProps = auth0.withPageAuthRequired();

export default function OnboardingCategories() {
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
          onNext={() => go("/onboarding/methods")}
          busy={leaving}
          error={error}
        />
      }
    >
      <CategoriesStep />
    </OnboardingLayout>
  );
}
