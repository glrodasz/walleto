import { useEffect } from "react";
import { OnboardingLayout } from "./OnboardingLayout";
import { IntroStage } from "./IntroStage";
import { WizardActions } from "./WizardActions";
import { SkipIntro } from "./SkipIntro";
import { INTRO_SLIDES } from "../data/introSlides";
import { useIntroSlides } from "../hooks/useIntroSlides";
import { useLeaveIntro } from "../hooks/useLeaveIntro";

/**
 * /onboarding: what Walleto is, one animated slide per Next, before the
 * wizard starts. Shown once (the guard sends new users here until
 * `onboardingIntroSeen`); Settings › Setup can replay it.
 */
export function IntroPage() {
  const slides = useIntroSlides(INTRO_SLIDES.length);
  const { replay, leave } = useLeaveIntro();
  const { next, back } = slides;

  // ← / → step through the slides, like a deck. Only moves: leaving the intro
  // stays a deliberate button press.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back]);

  const finishLabel = replay ? "Done" : "Start setup";

  return (
    <OnboardingLayout
      title="Welcome"
      fill
      footer={
        <WizardActions
          leading={
            // On the last slide the primary button already leaves.
            !slides.isLast && <SkipIntro label={replay ? "Close" : "Skip intro"} onClick={leave} />
          }
          onBack={slides.isFirst ? undefined : back}
          onNext={slides.isLast ? leave : next}
          nextLabel={slides.isLast ? finishLabel : "Next"}
        />
      }
    >
      <IntroStage
        slides={INTRO_SLIDES}
        index={slides.index}
        direction={slides.direction}
        onSelect={slides.goTo}
      />
    </OnboardingLayout>
  );
}
