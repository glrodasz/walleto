import type { ComponentType } from "react";
import type { IntroSlide, IntroSlideId } from "../data/introSlides";
import type { IntroDirection } from "../hooks/useIntroSlides";
import { splitEmphasis } from "../../../utils/emphasis";
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
          {/* Key phrases are bold, so the slide reads at a glance. */}
          <p className="body">
            {splitEmphasis(slide.body).map((part, n) =>
              part.strong ? (
                <strong key={n} className="key">
                  {part.text}
                </strong>
              ) : (
                part.text
              )
            )}
          </p>
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
          /* Room for the longest slide, so the footer doesn't shift between slides. */
          min-height: 11.5rem;
        }

        /* The title gets a wide measure; the body keeps a narrower one, which
           reads better over several lines. */
        .text {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .label {
          display: inline-flex;
          margin: 0;
          padding: 5px 12px;
          border-radius: var(--r-pill);
          background: var(--accent-soft);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .title {
          margin: 0;
          font-size: 2rem;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.025em;
          max-width: 48rem;
          color: var(--fg-0);
          text-wrap: balance;
        }

        .body {
          margin: 0;
          font-size: 1rem;
          line-height: 1.55;
          max-width: 36rem;
          color: var(--fg-1);
          text-wrap: pretty;
        }

        .key {
          font-weight: 650;
          color: var(--fg-0);
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

        /* Phones: the card takes the whole screen down to the footer bar. The
           scene grows into whatever height is spare and the text sits low,
           left-aligned and larger, where the thumb already is. */
        @media (max-width: 767px) {
          .stage {
            flex: 1;
            align-items: stretch;
            gap: 18px;
            padding: 12px 12px 24px;
            text-align: left;
          }

          .well {
            flex: 1;
            height: auto;
            min-height: 216px;
          }

          .dots {
            margin: -6px 0 -8px -2px;
            padding: 0 6px;
          }

          /* A fixed height for the text, so the scene above it never jumps
             when a slide's copy is longer. */
          .copy {
            min-height: 16rem;
            padding: 0 6px;
          }

          .text {
            align-items: flex-start;
            gap: 10px;
          }

          /* Balance evens out centred lines; left-aligned it leaves odd
             breaks ("You don't / have to set up…"). */
          .title {
            font-size: 1.75rem;
            line-height: 1.12;
            text-wrap: pretty;
          }

          .body {
            font-size: 1.0625rem;
            line-height: 1.5;
          }
        }

        /* Short phones (SE-sized): everything still has to fit above the
           footer bar, so the scene and the type give a little back. */
        @media (max-width: 767px) and (max-height: 740px) {
          .stage {
            gap: 14px;
            padding-bottom: 18px;
          }

          .well {
            min-height: 176px;
          }

          .copy {
            min-height: 0;
          }

          .title {
            font-size: 1.5rem;
          }

          .body {
            font-size: 1rem;
          }
        }
      `}</style>
    </section>
  );
}
