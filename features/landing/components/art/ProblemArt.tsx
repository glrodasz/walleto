import type { CSSProperties } from "react";

type Metal = "gold" | "silver" | "copper";

/** Light, body, edge and engraving shades of each metal. */
const METALS: Record<Metal, [string, string, string, string]> = {
  gold: ["#fff3c4", "#f2b630", "#b7791f", "#8a5a12"],
  silver: ["#ffffff", "#cfd8e3", "#8c9aae", "#4b5a70"],
  copper: ["#ffe1c7", "#e48a4e", "#a9531f", "#6f3210"],
};

const COINS: { symbol: string; metal: Metal; tilt: number }[] = [
  { symbol: "$", metal: "gold", tilt: -8 },
  { symbol: "€", metal: "silver", tilt: 6 },
  { symbol: "£", metal: "gold", tilt: -4 },
  { symbol: "kr", metal: "copper", tilt: 9 },
  { symbol: "¥", metal: "silver", tilt: -6 },
];

/** A coin drawn in vector: a lit metal face, a thick edge, a raised rim and an embossed symbol. */
function Coin({
  symbol,
  metal,
  tilt,
  index,
}: {
  symbol: string;
  metal: Metal;
  tilt: number;
  index: number;
}) {
  const [light, body, edge, ink] = METALS[metal];
  const face = `coin-face-${index}`;
  const inner = `coin-inner-${index}`;
  const small = symbol.length > 1;
  return (
    <svg
      className="coin"
      viewBox="0 0 64 64"
      style={{ "--coin-tilt": `${tilt}deg` } as CSSProperties}
    >
      <defs>
        <radialGradient id={face} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={light} />
          <stop offset="45%" stopColor={body} />
          <stop offset="100%" stopColor={edge} />
        </radialGradient>
        <linearGradient id={inner} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={body} />
          <stop offset="100%" stopColor={light} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* The edge: the coin's thickness, showing below the face. */}
      <circle cx="32" cy="34.5" r="28" fill={edge} />
      <circle cx="32" cy="32" r="28" fill={`url(#${face})`} />
      {/* A raised rim, lit on top and shaded underneath. */}
      <circle
        cx="32"
        cy="32"
        r="23.5"
        fill="none"
        stroke={light}
        strokeOpacity="0.8"
        strokeWidth="1.5"
      />
      <circle
        cx="32"
        cy="32.8"
        r="22.5"
        fill={`url(#${inner})`}
        stroke={edge}
        strokeOpacity="0.6"
        strokeWidth="1"
      />
      {/* Embossed symbol: a highlight a pixel below, the engraving on top. */}
      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
        fontWeight="700"
        fontSize={small ? 17 : 24}
        fill={light}
        transform="translate(0 1)"
      >
        {symbol}
      </text>
      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
        fontWeight="700"
        fontSize={small ? 17 : 24}
        fill={ink}
      >
        {symbol}
      </text>
      {/* A glint across the top left. */}
      <path
        d="M14 22 A20 20 0 0 1 30 10"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.7"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The three small drawings on the problem cards: past bars with an empty
 * slot for this month, spending next to money set aside, and a row of
 * currencies. Decorative — each card's text says the same thing.
 */
export function ProblemArt({ id }: { id: "1" | "2" | "3" }) {
  return (
    <div className={`mini mini--${id}`} aria-hidden="true">
      {id === "1" && (
        <>
          {[30, 52, 40, 62, 46].map((h, i) => (
            <i key={i} className="bar" style={{ height: `${h}px` }} />
          ))}
          <i className="bar bar--next" />
        </>
      )}
      {id === "2" && (
        <>
          <i className="block block--spent" />
          <i className="block block--kept" />
        </>
      )}
      {id === "3" && COINS.map((coin, i) => <Coin key={coin.symbol} index={i} {...coin} />)}
      <style jsx>{`
        .mini {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 64px;
        }

        .bar {
          flex: 1;
          border-radius: 3px;
          background: var(--line-strong);
        }

        .bar--next {
          height: 52px;
          background: transparent;
          border: 2px dashed var(--accent);
        }

        .mini--2 {
          align-items: flex-start;
          gap: 10px;
        }

        .block {
          height: 42px;
          border-radius: 8px;
        }

        .block--spent {
          flex: 3;
          background: var(--domain-expense);
          opacity: 0.75;
        }

        .block--kept {
          flex: 2;
          background: color-mix(in srgb, var(--domain-saving) 22%, transparent);
          border: 2px solid var(--domain-saving);
        }

        .mini--3 {
          align-items: center;
          gap: 0;
          padding-left: 4px;
        }

        /* Coins overlap a little, each at its own angle, like a handful on a table. */
        .mini--3 :global(.coin) {
          width: 62px;
          height: 62px;
          margin-left: -8px;
          flex-shrink: 0;
          transform: rotate(var(--coin-tilt));
          filter: drop-shadow(0 6px 6px rgba(15, 23, 42, 0.18));
        }

        .mini--3 :global(.coin:first-child) {
          margin-left: 0;
        }
      `}</style>
    </div>
  );
}
