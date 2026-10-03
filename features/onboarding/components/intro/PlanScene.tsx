import { IconDisc } from "../../../../components/molecules/IconDisc";
import { Calendar, Car, Cart, Repeat, Tag, Utensils } from "../../../../components/atoms/Icons";
import { SceneBit } from "./SceneBit";
import { SceneCanvas } from "./SceneCanvas";

/**
 * "A planner, not a logbook": single purchases pop up around the edges and
 * fade back, while one recurring plan takes the centre.
 */
export function PlanScene() {
  return (
    <SceneCanvas>
      <div className="at purchase purchase--cart">
        <SceneBit i={0} motion="dismiss" from={{ x: -14, y: -10 }}>
          <IconDisc color="var(--fg-2)" size={40}>
            <Cart size={18} />
          </IconDisc>
        </SceneBit>
      </div>
      <div className="at purchase purchase--food">
        <SceneBit i={1} motion="dismiss" from={{ x: 14, y: -10 }}>
          <IconDisc color="var(--fg-2)" size={40}>
            <Utensils size={18} />
          </IconDisc>
        </SceneBit>
      </div>
      <div className="at purchase purchase--car">
        <SceneBit i={2} motion="dismiss" from={{ x: -14, y: 10 }}>
          <IconDisc color="var(--fg-2)" size={40}>
            <Car size={18} />
          </IconDisc>
        </SceneBit>
      </div>
      <div className="at purchase purchase--tag">
        <SceneBit i={3} motion="dismiss" from={{ x: 14, y: 10 }}>
          <IconDisc color="var(--fg-2)" size={40}>
            <Tag size={18} />
          </IconDisc>
        </SceneBit>
      </div>

      <div className="at plan">
        <SceneBit i={5}>
          <IconDisc size={96}>
            <Calendar size={40} />
          </IconDisc>
        </SceneBit>
      </div>
      <div className="at repeat">
        <SceneBit i={7}>
          <span className="badge">
            <Repeat size={16} />
          </span>
        </SceneBit>
      </div>

      <style jsx>{`
        .at {
          position: absolute;
        }

        .purchase {
          width: 40px;
          height: 40px;
        }

        .purchase--cart {
          left: 24px;
          top: 20px;
        }

        .purchase--food {
          left: 256px;
          top: 26px;
        }

        .purchase--car {
          left: 34px;
          top: 140px;
        }

        .purchase--tag {
          left: 250px;
          top: 136px;
        }

        .plan {
          left: 112px;
          top: 52px;
          width: 96px;
          height: 96px;
        }

        .repeat {
          left: 186px;
          top: 44px;
          width: 34px;
          height: 34px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--accent);
          color: var(--on-accent);
          box-shadow: var(--shadow-sm);
        }
      `}</style>
    </SceneCanvas>
  );
}
