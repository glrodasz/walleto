import { IconDisc } from "../../../../components/molecules/IconDisc";
import { Badge } from "../../../../components/atoms/Badge";
import { Briefcase, CreditCard, Home } from "../../../../components/atoms/Icons";
import { SceneBit } from "./SceneBit";
import { SceneCanvas } from "./SceneCanvas";

const BILLS = ["Rent", "Utilities", "Gym", "Netflix"];

/**
 * "Start with the essentials": income, the card you pay with and your bills
 * drop in, then the bills you remember pop up underneath, with room for more.
 */
export function EssentialsScene() {
  return (
    <SceneCanvas>
      <div className="at item item--income">
        <SceneBit i={0} motion="drop">
          <span className="stack">
            <IconDisc domain="INCOME" size={60}>
              <Briefcase size={26} />
            </IconDisc>
            <span className="caption">Income</span>
          </span>
        </SceneBit>
      </div>
      <div className="at item item--card">
        <SceneBit i={1} motion="drop">
          <span className="stack">
            <IconDisc size={60}>
              <CreditCard size={26} />
            </IconDisc>
            <span className="caption">How you pay</span>
          </span>
        </SceneBit>
      </div>
      <div className="at item item--bills">
        <SceneBit i={2} motion="drop">
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
          <SceneBit key={bill} i={3 + n} inline>
            <Badge color="var(--domain-expense)">{bill}</Badge>
          </SceneBit>
        ))}
        <SceneBit i={3 + BILLS.length} inline>
          <Badge variant="outline">+ later</Badge>
        </SceneBit>
      </div>

      <style jsx>{`
        .at {
          position: absolute;
        }

        .item {
          top: 14px;
          width: 88px;
          height: 90px;
        }

        .item--income {
          left: 28px;
        }

        .item--card {
          left: 116px;
        }

        .item--bills {
          left: 204px;
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
