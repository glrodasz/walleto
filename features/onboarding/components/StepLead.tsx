import type { IntroSlideId } from "../data/introSlides";
import { introSlide } from "../data/introSlides";
import { INTRO_SCENES } from "./intro/scenes";
import { IntroLabel } from "./IntroLabel";
import { Emphasized } from "./Emphasized";

/**
 * The intro slide a wizard step explains, at the top of that step: its scene,
 * small, beside its label and body. The copy comes from INTRO_SLIDES, so the
 * step doesn't say it again. No heading: the step's own structure stays.
 *
 * Phones get the text alone: the forms below are long, the footer bar is
 * fixed, and the scenes' captions don't survive a smaller scale.
 */
export function StepLead({ id }: { id: IntroSlideId }) {
  const slide = introSlide(id);
  const Scene = INTRO_SCENES[id];

  return (
    <div className="lead">
      <div className="art">
        {/* Scaled here, in this file's own JSX, so the rule keeps its scope. */}
        <div className="scene">
          <Scene />
        </div>
      </div>
      <div className="text">
        <IntroLabel>{slide.label}</IntroLabel>
        <p className="body">
          <Emphasized text={slide.body} />
        </p>
      </div>

      <style jsx>{`
        .lead {
          --lead-scale: 0.55;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        /* The scene's 320×200 box at --lead-scale, plus a little air. */
        .art {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          width: calc(320px * var(--lead-scale) + 24px);
          height: calc(200px * var(--lead-scale) + 16px);
          border-radius: var(--r-lg);
          background: var(--glass-inset);
          overflow: hidden;
        }

        .scene {
          flex-shrink: 0;
          transform: scale(var(--lead-scale));
        }

        .text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          min-width: 0;
        }

        .body {
          margin: 0;
          max-width: 40rem;
          font-size: 0.9375rem;
          line-height: 1.5;
          color: var(--fg-1);
          text-wrap: pretty;
        }

        @media (max-width: 767px) {
          .art {
            display: none;
          }

          .body {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
}
