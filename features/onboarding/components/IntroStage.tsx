import type { ComponentType } from "react";
import type { IntroSlide, IntroSlideId } from "../data/introSlides";
import type { IntroDirection } from "../hooks/useIntroSlides";
import { PlanScene } from "./intro/PlanScene";
import { FlowScene } from "./intro/FlowScene";
import { LaterScene } from "./intro/LaterScene";
import { EssentialsScene } from "./intro/EssentialsScene";
import { WorthScene } from "./intro/WorthScene";
import { CurrencyScene } from "./intro/CurrencyScene";

const SCENES: Record<IntroSlideId, ComponentType> = {
  planner: PlanScene,
  clarity: FlowScene,
  later: LaterScene,
  essentials: EssentialsScene,
  worth: WorthScene,
  currencies: CurrencyScene,
};

interface Props {
  slides: readonly IntroSlide[];
  index: number;
  direction: IntroDirection;
  onSelect: (index: number) => void;
}

/**
 * One intro slide: its scene, the dots that say where you are, and its text.
 * Scene and text are keyed by slide, so every move remounts them and their
 * pieces animate in again, from the side the move came from.
 */
export function IntroStage({ slides, index, direction, onSelect }: Props) {
  const slide = slides[index];
  const Scene = SCENES[slide.id];

  return (
    <section className="glass stage" aria-label="What is Walleto">
      <div className="well">
        <div key={slide.id} className="enter" data-dir={direction}>
          <Scene />
        </div>
      </div>

      {/* Between scene and text, so a longer slide never moves them. */}
      <ol className="dots">
        {slides.map((s, n) => (
          <li key={s.id}>
            <button
              type="button"
              className={`dot${n === index ? " dot--current" : ""}`}
              aria-label={`Slide ${n + 1} of ${slides.length}`}
              aria-current={n === index ? "step" : undefined}
              onClick={() => onSelect(n)}
            >
              <span className="pip" />
            </button>
          </li>
        ))}
      </ol>

      {/* The live region stays mounted; only its content swaps, so screen
          readers announce each new slide. */}
      <div className="copy" aria-live="polite">
        <div key={slide.id} className="enter text" data-dir={direction}>
          <p className="label">{slide.label}</p>
          <h2 className="title">{slide.title}</h2>
          <p className="body">{slide.body}</p>
        </div>
      </div>

      <style jsx>{`
        .stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          padding: 24px 24px 20px;
          border-radius: var(--r-xl);
          text-align: center;
        }

        .well {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 232px;
          border-radius: var(--r-lg);
          background: var(--glass-inset);
          overflow: hidden;
        }

        .enter {
          animation: enter-forward 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .enter[data-dir="back"] {
          animation-name: enter-back;
        }

        @keyframes enter-forward {
          from {
            opacity: 0;
            transform: translateX(28px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        @keyframes enter-back {
          from {
            opacity: 0;
            transform: translateX(-28px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        .copy {
          width: 100%;
          max-width: 34rem;
          /* Room for the longest slide, so the footer doesn't shift between slides. */
          min-height: 10rem;
        }

        .text {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .label {
          margin: 0;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .title {
          margin: 0;
          font-size: 1.375rem;
          font-weight: 700;
          line-height: 1.25;
          color: var(--fg-0);
          text-wrap: balance;
        }

        .body {
          margin: 0;
          font-size: 0.9375rem;
          line-height: 1.55;
          color: var(--fg-1);
          text-wrap: pretty;
        }

        /* Closer to the scene than the stage gap: they belong to it. */
        .dots {
          list-style: none;
          margin: -12px 0 -4px;
          padding: 0;
          display: flex;
          gap: 2px;
        }

        /* A 24px hit area around a small pip. */
        .dot {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          padding: 0;
          border: none;
          background: none;
          cursor: pointer;
        }

        .pip {
          width: 8px;
          height: 8px;
          border-radius: var(--r-pill);
          background: var(--line-strong);
          transition:
            width 240ms cubic-bezier(0.22, 1, 0.36, 1),
            background 240ms;
        }

        .dot:hover .pip {
          background: var(--fg-2);
        }

        .dot--current .pip,
        .dot--current:hover .pip {
          width: 22px;
          background: var(--accent);
        }

        @media (max-width: 767px) {
          .stage {
            padding: 16px 16px 12px;
            gap: 20px;
          }

          .well {
            height: 210px;
          }

          .title {
            font-size: 1.1875rem;
          }

          /* The footer is a fixed bar here: nothing below the text to keep still. */
          .copy {
            min-height: 0;
          }
        }
      `}</style>
    </section>
  );
}
