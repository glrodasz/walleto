import { IconDisc } from "../../../../components/molecules/IconDisc";
import { Badge } from "../../../../components/atoms/Badge";
import { Briefcase } from "../../../../components/atoms/Icons";
import { SceneBit } from "./SceneBit";
import { SceneCanvas } from "./SceneCanvas";

/**
 * "Your main income comes first": income drops in, then the salary pops up
 * underneath, with room for side income later.
 */
export function IncomeScene() {
  return (
    <SceneCanvas>
      <div className="at item">
        <SceneBit i={0} motion="drop">
          <span className="stack">
            <IconDisc domain="INCOME" size={60}>
              <Briefcase size={26} />
            </IconDisc>
            <span className="caption">Income</span>
          </span>
        </SceneBit>
      </div>

      <div className="at chips">
        <SceneBit i={1} inline>
          <Badge color="var(--domain-income)">Salary</Badge>
        </SceneBit>
        <SceneBit i={2} inline>
          <Badge variant="outline">+ side income</Badge>
        </SceneBit>
      </div>

      <style jsx>{`
        .at {
          position: absolute;
        }

        .item {
          top: 14px;
          left: 116px;
          width: 88px;
          height: 90px;
        }

        .stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .caption {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--fg-2);
          white-space: nowrap;
        }

        .chips {
          left: 12px;
          right: 12px;
          top: 128px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }
      `}</style>
    </SceneCanvas>
  );
}
