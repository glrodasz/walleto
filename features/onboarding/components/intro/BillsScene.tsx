import { IconDisc } from "../../../../components/molecules/IconDisc";
import { Badge } from "../../../../components/atoms/Badge";
import { Home } from "../../../../components/atoms/Icons";
import { SceneBit } from "./SceneBit";
import { SceneCanvas } from "./SceneCanvas";

const BILLS = ["Rent", "Utilities", "Gym", "Netflix"];

/**
 * "The bills you remember": bills drop in, then the ones you remember pop up
 * underneath, with room for more.
 */
export function BillsScene() {
  return (
    <SceneCanvas>
      <div className="at item">
        <SceneBit i={0} motion="drop">
          <span className="stack">
            <IconDisc domain="EXPENSE" size={60}>
              <Home size={26} />
            </IconDisc>
            <span className="caption">Bills</span>
          </span>
        </SceneBit>
      </div>

      <div className="at chips">
        {BILLS.map((bill, n) => (
          <SceneBit key={bill} i={1 + n} inline>
            <Badge color="var(--domain-expense)">{bill}</Badge>
          </SceneBit>
        ))}
        <SceneBit i={1 + BILLS.length} inline>
          <Badge variant="outline">+ later</Badge>
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
