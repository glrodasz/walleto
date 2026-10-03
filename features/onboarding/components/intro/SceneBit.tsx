import type { CSSProperties, ReactNode } from "react";

/**
 * How a piece of an intro scene arrives:
 * - pop: scales up from small (the default).
 * - rise / drop: slides up / falls into place.
 * - fade: opacity only.
 * - dismiss: pops in, holds, then shrinks and fades towards `from` (it stays
 *   faintly visible: the "every purchase" clutter the plan replaces).
 * - turn: a slow quarter-turn in (the settings gear).
 * - glide: travels in from `from` (the currency chips).
 * - grow-up / grow-down: a bar growing from the baseline.
 */
export type SceneMotion =
  | "pop"
  | "rise"
  | "drop"
  | "fade"
  | "dismiss"
  | "turn"
  | "glide"
  | "grow-up"
  | "grow-down";

interface Props {
  /** Order of appearance: each step waits a little longer than the last. */
  i: number;
  motion?: SceneMotion;
  /** Offset in px that `glide` starts from and `dismiss` drifts towards. */
  from?: { x: number; y: number };
  /** Sit in a flow (a wrapping row of chips) instead of filling a placed box. */
  inline?: boolean;
  children?: ReactNode;
}

/**
 * The single place intro motion lives. Scenes position a box and drop a
 * SceneBit inside; it fills that box and animates it in on mount. styled-jsx
 * scopes `@keyframes` per component, so keeping them here means six scenes
 * share one set instead of copying it.
 *
 * Motion only ever delays reaching the final frame: with reduced motion the
 * global rule in globals.css zeroes duration and delay, so every piece is
 * simply there.
 */
export function SceneBit({ i, motion = "pop", from, inline, children }: Props) {
  const style = {
    "--i": i,
    "--dx": `${from?.x ?? 0}px`,
    "--dy": `${from?.y ?? 0}px`,
  } as CSSProperties;

  return (
    <span className={`bit bit--${motion}${inline ? " bit--inline" : ""}`} style={style}>
      {children}
      <style jsx>{`
        .bit {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          animation-duration: 560ms;
          animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
          animation-fill-mode: both;
          animation-delay: calc(var(--i, 0) * 110ms + 120ms);
        }

        .bit--inline {
          display: inline-flex;
          width: auto;
          height: auto;
        }

        .bit--pop {
          animation-name: pop;
        }

        .bit--rise {
          animation-name: rise;
        }

        .bit--drop {
          animation-name: drop;
          animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .bit--fade {
          animation-name: fade;
        }

        .bit--dismiss {
          animation-name: dismiss;
          animation-duration: 1500ms;
          animation-timing-function: ease-in-out;
        }

        .bit--turn {
          animation-name: turn;
          animation-duration: 900ms;
        }

        .bit--glide {
          animation-name: glide;
          animation-duration: 800ms;
        }

        .bit--grow-up {
          animation-name: grow;
          transform-origin: bottom;
        }

        .bit--grow-down {
          animation-name: grow;
          transform-origin: top;
        }

        @keyframes pop {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        @keyframes drop {
          from {
            opacity: 0;
            transform: translateY(-22px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        @keyframes fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes dismiss {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          25%,
          55% {
            opacity: 1;
            transform: none;
          }
          100% {
            opacity: 0.35;
            transform: translate(var(--dx), var(--dy)) scale(0.7);
          }
        }

        @keyframes turn {
          from {
            opacity: 0;
            transform: rotate(-120deg) scale(0.7);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        @keyframes glide {
          from {
            opacity: 0;
            transform: translate(var(--dx), var(--dy)) scale(0.7);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        @keyframes grow {
          from {
            transform: scaleY(0);
          }
          to {
            transform: none;
          }
        }
      `}</style>
    </span>
  );
}
