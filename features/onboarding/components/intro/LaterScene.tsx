import { IconDisc } from "../../../../components/molecules/IconDisc";
import { Check, Settings } from "../../../../components/atoms/Icons";
import { SceneBit } from "./SceneBit";
import { SceneCanvas } from "./SceneCanvas";

/**
 * "No rush": the settings gear turns in beside a short checklist. Two rows
 * get ticked; the third stays an open slot for later.
 */
export function LaterScene() {
  return (
    <SceneCanvas>
      <div className="at gear">
        <SceneBit i={0} motion="turn">
          <IconDisc size={84}>
            <Settings size={36} />
          </IconDisc>
        </SceneBit>
      </div>

      <div className="at row row--1">
        <SceneBit i={1} motion="rise">
          <span className="pill">
            <span className="tick">
              <SceneBit i={4}>
                <IconDisc domain="INCOME" size={24}>
                  <Check size={14} />
                </IconDisc>
              </SceneBit>
            </span>
            <span className="text">
              <span className="line line--long" />
              <span className="line line--short" />
            </span>
          </span>
        </SceneBit>
      </div>
      <div className="at row row--2">
        <SceneBit i={2} motion="rise">
          <span className="pill">
            <span className="tick">
              <SceneBit i={5}>
                <IconDisc domain="INCOME" size={24}>
                  <Check size={14} />
                </IconDisc>
              </SceneBit>
            </span>
            <span className="text">
              <span className="line line--mid" />
              <span className="line line--short" />
            </span>
          </span>
        </SceneBit>
      </div>
      <div className="at row row--3">
        <SceneBit i={3} motion="rise">
          <span className="pill pill--later">
            <span className="tick tick--open" />
            <span className="later">Later</span>
          </span>
        </SceneBit>
      </div>

      <style jsx>{`
        .at {
          position: absolute;
        }

        .gear {
          left: 22px;
          top: 58px;
          width: 84px;
          height: 84px;
        }

        .row {
          left: 128px;
          width: 172px;
          height: 40px;
        }

        .row--1 {
          top: 30px;
        }

        .row--2 {
          top: 80px;
        }

        .row--3 {
          top: 130px;
        }

        .pill {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          height: 100%;
          padding: 0 12px;
          border-radius: var(--r-pill);
          background: var(--glass-raised);
          box-shadow: var(--shadow-sm);
        }

        .pill--later {
          background: transparent;
          box-shadow: none;
          border: 1.5px dashed var(--line-strong);
        }

        .tick {
          display: inline-flex;
          flex-shrink: 0;
          width: 24px;
          height: 24px;
        }

        .tick--open {
          border-radius: 50%;
          border: 1.5px dashed var(--line-strong);
        }

        .text {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 1;
        }

        .line {
          height: 5px;
          border-radius: var(--r-pill);
          background: var(--line-strong);
        }

        .line--long {
          width: 90%;
        }

        .line--mid {
          width: 70%;
        }

        .line--short {
          width: 45%;
          opacity: 0.6;
        }

        .later {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--fg-2);
        }
      `}</style>
    </SceneCanvas>
  );
}
