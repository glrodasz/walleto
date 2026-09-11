import { withOnboardingGuard } from "../features/onboarding/helpers/onboardingGuard";
import { DomainPage } from "../features/domains/components/DomainPage";

export const getServerSideProps = withOnboardingGuard();

export default function IncomesPage() {
  return <DomainPage domain="INCOME" />;
}
