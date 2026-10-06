import type { IntroSlideId } from "../data/introSlides";
import { INTRO_SLIDES } from "../data/introSlides";
import { INTRO_SCENES } from "./intro/scenes";
import { IntroLabel } from "./IntroLabel";
import { Emphasized } from "./Emphasized";

interface Props {
  id: IntroSlideId;
  /**
   * Keep the scene (and its card) when the layout stacks to one column. Only
   * a screen with no form under it can afford it: the Welcome.
   */
  sceneWhenStacked?: boolean;
}

/**
 * A screen's intro slide. Beside the step (≥1200px) it is a card: the scene,
 * then the label, title and body. Stacked above a step it is just those lines
 * of text, so the form stays near the top.
 *
 * Every step is its own route, so the scene animates in again on each one.
 */
export function IntroPanel({ id, sceneWhenStacked = false }: Props) {
  const slide = INTRO_SLIDES[id];
  const Scene = INTRO_SCENES[id];

  return (
    <div className={`panel${sceneWhenStacked ? "" : " panel--bare"}`}>
      <div className="glass card">
        <div className="well">
          <Scene />
        </div>
        <div className="text">
          <IntroLabel>{slide.label}</IntroLabel>
          <h2 className="title">{slide.title}</h2>
          <p className="body">
            <Emphasized text={slide.body} />
          </p>
        </div>
      </div>

      <style jsx>{`
        .panel {
          display: flex;
          flex-direction: column;
        }

        .card {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 16px 16px 24px;
          border-radius: var(--r-xl);
        }

        .well {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 224px;
          border-radius: var(--r-lg);
          background: var(--glass-inset);
          overflow: hidden;
        }

        .text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          padding: 0 8px;
        }

        .title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: var(--fg-0);
          text-wrap: pretty;
        }

        .body {
          margin: 0;
          max-width: 40rem;
          font-size: 0.9375rem;
          line-height: 1.55;
          color: var(--fg-1);
          text-wrap: pretty;
        }

        /* Stacked above a step (below OnboardingLayout's 1200px split): no box
           at all, so no glass is painted, and no scene — just the text. */
        @media (max-width: 1199px) {
          .panel--bare .card {
            display: contents;
          }

          .panel--bare .well {
            display: none;
          }

          .panel--bare .text {
            gap: 8px;
            padding: 0;
          }

          .panel--bare .title {
            font-size: 1.25rem;
            font-weight: 750;
          }
        }

        @media (max-width: 767px) {
          .card {
            gap: 16px;
            padding: 12px 12px 20px;
          }

          .well {
            height: 216px;
          }

          .title {
            font-size: 1.375rem;
          }

          .panel--bare .title {
            font-size: 1.125rem;
          }

          .panel--bare .body {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
}
