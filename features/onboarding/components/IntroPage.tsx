import { IntroTour } from "./IntroTour";
import { IntroWelcome } from "./IntroWelcome";
import { useLeaveIntro } from "../hooks/useLeaveIntro";

/**
 * /onboarding. A new user gets the Welcome, once (the guard sends them here
 * until `onboardingIntroSeen`); Settings › Setup opens it with `?tour=1` for
 * the full six-slide tour.
 */
export function IntroPage() {
  const { ready, replay, leave } = useLeaveIntro();

  // The query isn't parsed yet: never flash the Welcome at someone replaying.
  if (!ready) return null;

  return replay ? <IntroTour onLeave={leave} /> : <IntroWelcome onStart={leave} />;
}
