import { IconDisc } from "../../../../components/molecules/IconDisc";
import { Chart, Landmark, Piggy, TrendingUp } from "../../../../components/atoms/Icons";
import { SceneBit } from "./SceneBit";
import { SceneCanvas } from "./SceneCanvas";

/**
 * "The bigger picture": investments and savings grow up from a baseline,
 * a debt hangs below it, and what's left is the net worth.
 */
export function WorthScene() {
  return (
    <SceneCanvas>
      <div className="at baseline">
        <SceneBit i={0} motion="fade">
          <span className="rule" />
        </SceneBit>
      </div>

      <div className="at disc disc--investment">
        <SceneBit i={0}>
          <IconDisc domain="INVESTMENT" size={36}>
            <TrendingUp size={16} />
          </IconDisc>
        </SceneBit>
      </div>
      <div className="at bar bar--investment">
        <SceneBit i={1} motion="grow-up">
          <span className="fill fill--up fill--investment" />
        </SceneBit>
      </div>

      <div className="at disc disc--saving">
        <SceneBit i={2}>
          <IconDisc domain="SAVING" size={36}>
            <Piggy size={16} />
          </IconDisc>
        </SceneBit>
      </div>
      <div className="at bar bar--saving">
        <SceneBit i={3} motion="grow-up">
          <span className="fill fill--up fill--saving" />
        </SceneBit>
      </div>

      <div className="at bar bar--debt">
        <SceneBit i={4} motion="grow-down">
          <span className="fill fill--down fill--debt" />
        </SceneBit>
      </div>
      <div className="at disc disc--debt">
        <SceneBit i={5}>
          <IconDisc domain="DEBT" size={36}>
            <Landmark size={16} />
          </IconDisc>
        </SceneBit>
      </div>

      <div className="at equals">
        <SceneBit i={6} motion="fade">
          <span className="sign">=</span>
        </SceneBit>
      </div>

      <div className="at disc disc--worth">
        <SceneBit i={7}>
          <IconDisc size={36}>
            <Chart size={16} />
          </IconDisc>
        </SceneBit>
      </div>
      <div className="at bar bar--worth">
        <SceneBit i={8} motion="grow-up">
          <span className="fill fill--up fill--worth" />
        </SceneBit>
      </div>

      <style jsx>{`
        .at {
          position: absolute;
        }

        /* The baseline sits at y=124: assets stand on it, the debt hangs
           from it, so net worth = the two bars above minus the one below. */
        .baseline {
          left: 16px;
          top: 123px;
          width: 288px;
          height: 2px;
        }

        .rule {
          width: 100%;
          height: 100%;
          border-radius: var(--r-pill);
          background: var(--line-strong);
        }

        .disc {
          width: 36px;
          height: 36px;
        }

        .bar {
          width: 40px;
        }

        .fill {
          width: 100%;
          height: 100%;
        }

        .fill--up {
          border-radius: 8px 8px 0 0;
        }

        .fill--down {
          border-radius: 0 0 8px 8px;
        }

        .bar--investment {
          left: 28px;
          top: 64px;
          height: 60px;
        }

        .disc--investment {
          left: 30px;
          top: 22px;
        }

        .fill--investment {
          background: color-mix(in srgb, var(--domain-investment) 45%, transparent);
        }

        .bar--saving {
          left: 96px;
          top: 82px;
          height: 42px;
        }

        .disc--saving {
          left: 98px;
          top: 40px;
        }

        .fill--saving {
          background: color-mix(in srgb, var(--domain-saving) 45%, transparent);
        }

        .bar--debt {
          left: 164px;
          top: 125px;
          height: 30px;
        }

        .disc--debt {
          left: 166px;
          top: 161px;
        }

        .fill--debt {
          background: color-mix(in srgb, var(--domain-debt) 45%, transparent);
        }

        .equals {
          left: 212px;
          top: 86px;
          width: 32px;
          height: 32px;
        }

        .sign {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--fg-2);
        }

        .bar--worth {
          left: 256px;
          top: 52px;
          height: 72px;
        }

        .disc--worth {
          left: 258px;
          top: 10px;
        }

        .fill--worth {
          background: var(--accent);
        }
      `}</style>
    </SceneCanvas>
  );
}
