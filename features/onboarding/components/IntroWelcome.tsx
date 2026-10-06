import { OnboardingLayout } from "./OnboardingLayout";
import { IntroCard } from "./IntroCard";
import { WizardActions } from "./WizardActions";
import { WELCOME } from "../data/introSlides";

/**
 * A new user's one screen before the wizard: what Walleto is, on one card,
 * under the stepper as a preview of what's ahead. No skip link: "Start setup"
 * lands on step 1, which has its own "Skip for now".
 */
export function IntroWelcome({ onStart }: { onStart: () => void }) {
  return (
    <OnboardingLayout
      title="Welcome"
      step={0}
      fill
      footer={<WizardActions onNext={onStart} nextLabel="Start setup" />}
    >
      <IntroCard slide={WELCOME} />
    </OnboardingLayout>
  );
}
