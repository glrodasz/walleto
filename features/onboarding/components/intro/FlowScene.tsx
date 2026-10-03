import type { CSSProperties } from "react";
import { IconDisc } from "../../../../components/molecules/IconDisc";
import { Briefcase, Home, Play, Wallet, Zap } from "../../../../components/atoms/Icons";
import { SceneBit } from "./SceneBit";
import { SceneCanvas } from "./SceneCanvas";

/**
 * "See where it goes": income flows into the wallet, and three lines carry
 * it out to rent, utilities and a subscription.
 */
export function FlowScene() {
  return (
    <SceneCanvas>
      <svg className="lines" viewBox="0 0 320 200" width="320" height="200">
        <path
          className="line line--in"
          d="M64 100 H122"
          pathLength={1}
          style={{ "--i": 1 } as CSSProperties}
        />
        <path
          className="line line--out"
          d="M198 100 C230 100 228 40 258 40"
          pathLength={1}
          style={{ "--i": 3 } as CSSProperties}
        />
        <path
          className="line line--out"
          d="M198 100 H258"
          pathLength={1}
          style={{ "--i": 3.5 } as CSSProperties}
        />
        <path
          className="line line--out"
          d="M198 100 C230 100 228 160 258 160"
          pathLength={1}
          style={{ "--i": 4 } as CSSProperties}
        />
      </svg>

      <div className="at income">
        <SceneBit i={0}>
          <IconDisc domain="INCOME" size={56}>
            <Briefcase size={24} />
          </IconDisc>
        </SceneBit>
      </div>
      <div className="at wallet">
        <SceneBit i={2}>
          <IconDisc size={68}>
            <Wallet size={30} />
          </IconDisc>
        </SceneBit>
      </div>
      <div className="at out out--rent">
        <SceneBit i={4.5}>
          <IconDisc domain="EXPENSE" size={44}>
            <Home size={20} />
          </IconDisc>
        </SceneBit>
      </div>
      <div className="at out out--bills">
        <SceneBit i={5}>
          <IconDisc domain="EXPENSE" size={44}>
            <Zap size={20} />
          </IconDisc>
        </SceneBit>
      </div>
      <div className="at out out--subs">
        <SceneBit i={5.5}>
          <IconDisc domain="EXPENSE" size={44}>
            <Play size={20} />
          </IconDisc>
        </SceneBit>
      </div>

      <style jsx>{`
        .lines {
          position: absolute;
          inset: 0;
          overflow: visible;
        }

        /* pathLength=1 lets one dash cover any path: offset 1 → 0 draws it. */
        .line {
          fill: none;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-dasharray: 1;
          opacity: 0.6;
          animation: draw 600ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: calc(var(--i, 0) * 110ms + 120ms);
        }

        .line--in {
          stroke: var(--domain-income);
        }

        .line--out {
          stroke: var(--domain-expense);
        }

        @keyframes draw {
          from {
            stroke-dashoffset: 1;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .at {
          position: absolute;
        }

        .income {
          left: 8px;
          top: 72px;
          width: 56px;
          height: 56px;
        }

        .wallet {
          left: 126px;
          top: 66px;
          width: 68px;
          height: 68px;
        }

        .out {
          left: 262px;
          width: 44px;
          height: 44px;
        }

        .out--rent {
          top: 18px;
        }

        .out--bills {
          top: 78px;
        }

        .out--subs {
          top: 138px;
        }
      `}</style>
    </SceneCanvas>
  );
}
