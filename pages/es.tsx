import { LandingPage } from "../features/landing/components/LandingPage";
import { getLandingProps } from "../features/landing/helpers/landingProps";
import type { LandingRouteProps } from "../features/landing/helpers/landingProps";

export const getServerSideProps = getLandingProps;

export default function LandingEs({ origin, signedIn }: LandingRouteProps) {
  return <LandingPage language="es" origin={origin} signedIn={signedIn} />;
}
