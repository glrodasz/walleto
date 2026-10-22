import type { GetServerSideProps } from "next";
import auth0 from "../lib/auth0";
import { withOnboardingGuard } from "../features/onboarding/helpers/onboardingGuard";
import { DashboardPage } from "../features/dashboard/components/DashboardPage";
import { LandingPage } from "../features/landing/components/LandingPage";
import { usePreferences } from "../hooks/usePreferences";
import { requestOrigin } from "../utils/requestOrigin";

type Props = { landing?: { origin: string } };

const guard = withOnboardingGuard();

// Signed out, `/` is the landing page (in the negotiated language) instead of
// a bounce to the sign-in form; signed in, it's the dashboard as before.
export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = await auth0.getSession(ctx.req, ctx.res);
  if (!session) {
    return { props: { landing: { origin: requestOrigin(ctx.req.headers) ?? "" } } };
  }
  return guard(ctx) as ReturnType<GetServerSideProps<Props>>;
};

function Landing({ origin }: { origin: string }) {
  const { language } = usePreferences();
  return <LandingPage language={language} origin={origin} />;
}

export default function Home({ landing }: Props) {
  return landing ? <Landing origin={landing.origin} /> : <DashboardPage />;
}
