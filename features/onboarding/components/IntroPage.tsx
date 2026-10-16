import { OnboardingLayout } from "./OnboardingLayout";
import { SetupOverview } from "./SetupOverview";
import { WizardActions } from "./WizardActions";
import { WELCOME_INTRO } from "../data/steps";
import { useLeaveIntro } from "../hooks/useLeaveIntro";
import { useT } from "../../../hooks/useT";
import { ONBOARDING_MESSAGES } from "../messages";

/**
 * /onboarding, the Welcome: what Walleto is beside what the setup covers,
 * then "Start setup". The guard sends new users here until
 * `onboardingIntroSeen`; Settings › Setup › "Run setup again" opens it too.
 */
export function IntroPage() {
  const { leave } = useLeaveIntro();
  const t = useT(ONBOARDING_MESSAGES);

  return (
    <OnboardingLayout
      title={t("welcome.title")}
      intro={WELCOME_INTRO}
      footer={<WizardActions onNext={leave} nextLabel={t("welcome.start")} />}
    >
      <SetupOverview />
    </OnboardingLayout>
  );
}
