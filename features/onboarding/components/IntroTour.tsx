import { useEffect } from "react";
import { OnboardingLayout } from "./OnboardingLayout";
import { IntroStage } from "./IntroStage";
import { WizardActions } from "./WizardActions";
import { SkipIntro } from "./SkipIntro";
import { INTRO_SLIDES } from "../data/introSlides";
import { useIntroSlides } from "../hooks/useIntroSlides";

/**
 * The full six-slide tour, one animated slide per Next. Only Settings › Setup
 * opens it ("Watch the intro"), so every way out leads back there.
 */
export function IntroTour({ onLeave }: { onLeave: () => void }) {
  const slides = useIntroSlides(INTRO_SLIDES.length);
  const { next, back } = slides;

  // ← / → step through the slides, like a deck. Only moves: leaving the tour
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

  return (
    <OnboardingLayout
      title="Welcome"
      fill
      footer={
        <WizardActions
          leading={
            // On the last slide the primary button already leaves.
            !slides.isLast && <SkipIntro label="Close" onClick={onLeave} />
          }
          onBack={slides.isFirst ? undefined : back}
          onNext={slides.isLast ? onLeave : next}
          nextLabel={slides.isLast ? "Done" : "Next"}
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
