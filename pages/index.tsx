import { withOnboardingGuard } from "../features/onboarding/helpers/onboardingGuard";
import { DashboardPage } from "../features/dashboard/components/DashboardPage";

export const getServerSideProps = withOnboardingGuard();

export default function Dashboard() {
  return <DashboardPage />;
}
