import { withOnboardingGuard } from "../features/onboarding/helpers/onboardingGuard";
import { ProspectPage } from "../features/prospect/components/ProspectPage";

export const getServerSideProps = withOnboardingGuard();

export default function Prospect() {
  return <ProspectPage />;
}
