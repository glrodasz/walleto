import type { IntroSlide } from "../data/introSlides";
import type { IntroDirection } from "../hooks/useIntroSlides";
import { IntroCard } from "./IntroCard";
import { IntroDots } from "./IntroDots";

interface Props {
  slides: readonly IntroSlide[];
  index: number;
  direction: IntroDirection;
  onSelect: (index: number) => void;
}

/** One slide of the tour, with the dots that say where you are. */
export function IntroStage({ slides, index, direction, onSelect }: Props) {
  return (
    <IntroCard
      slide={slides[index]}
      direction={direction}
      nav={<IntroDots count={slides.length} index={index} onSelect={onSelect} />}
    />
  );
}
