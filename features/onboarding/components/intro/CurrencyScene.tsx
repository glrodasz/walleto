import { IconDisc } from "../../../../components/molecules/IconDisc";
import { Badge } from "../../../../components/atoms/Badge";
import { Coins } from "../../../../components/atoms/Icons";
import { SceneBit } from "./SceneBit";
import { SceneCanvas } from "./SceneCanvas";

/** Where each chip rests on the ring, and the outward offset it glides in from. */
const CURRENCIES = [
  { code: "USD", spot: "usd", from: { x: 0, y: -60 } },
  { code: "EUR", spot: "eur", from: { x: 58, y: -20 } },
  { code: "GBP", spot: "gbp", from: { x: 36, y: 50 } },
  { code: "COP", spot: "cop", from: { x: -36, y: 50 } },
  { code: "SEK", spot: "sek", from: { x: -58, y: -20 } },
] as const;

/**
 * "Multi-currency by default": currency chips glide in from every side and
 * settle on one ring around a single pot.
 */
export function CurrencyScene() {
  return (
    <SceneCanvas>
      <div className="at ring">
        <SceneBit i={0} motion="fade">
          <svg viewBox="0 0 160 160" width="160" height="160">
            <circle className="orbit" cx="80" cy="80" r="78" />
          </svg>
        </SceneBit>
      </div>

      <div className="at pot">
        <SceneBit i={1}>
          <IconDisc size={76}>
            <Coins size={32} />
          </IconDisc>
        </SceneBit>
      </div>

      {CURRENCIES.map((c, n) => (
        <div key={c.code} className={`at chip chip--${c.spot}`}>
          <SceneBit i={2 + n} motion="glide" from={c.from}>
            <span className="backing">
              <Badge caps tone="info">
                {c.code}
              </Badge>
            </span>
          </SceneBit>
        </div>
      ))}

      <style jsx>{`
        .at {
          position: absolute;
        }

        .ring {
          left: 80px;
          top: 20px;
          width: 160px;
          height: 160px;
        }

        .orbit {
          fill: none;
          stroke: var(--line-strong);
          stroke-width: 1.5;
          stroke-dasharray: 4 6;
        }

        .pot {
          left: 122px;
          top: 62px;
          width: 76px;
          height: 76px;
        }

        /* Chips sit on the ring (r=78 around 160,100), 56×26 boxes centred on it. */
        .chip {
          width: 56px;
          height: 26px;
        }

        /* The badge's tint is translucent: back it so the ring doesn't show through. */
        .backing {
          display: inline-flex;
          border-radius: var(--r-pill);
          background: var(--glass-raised);
          box-shadow: var(--shadow-sm);
        }

        .chip--usd {
          left: 132px;
          top: 9px;
        }

        .chip--eur {
          left: 206px;
          top: 63px;
        }

        .chip--gbp {
          left: 178px;
          top: 150px;
        }

        .chip--cop {
          left: 86px;
          top: 150px;
        }

        .chip--sek {
          left: 58px;
          top: 63px;
        }
      `}</style>
    </SceneCanvas>
  );
}
