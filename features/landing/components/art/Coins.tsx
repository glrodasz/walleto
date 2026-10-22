type Metal = "gold" | "silver" | "copper";

/** Highlight, body, shade and deep-shadow tones of each metal. */
const METALS: Record<Metal, { hi: string; body: string; shade: string; deep: string }> = {
  gold: { hi: "#fff6d2", body: "#f4bb36", shade: "#c7871c", deep: "#7a4c0c" },
  silver: { hi: "#ffffff", body: "#d3dbe6", shade: "#93a1b5", deep: "#4a5870" },
  copper: { hi: "#ffe4cc", body: "#e8915a", shade: "#b35a24", deep: "#5f2a0d" },
};

const PILES: { symbol: string; metal: Metal; height: number }[] = [
  { symbol: "$", metal: "gold", height: 3 },
  { symbol: "€", metal: "silver", height: 1 },
  { symbol: "£", metal: "gold", height: 2 },
  { symbol: "kr", metal: "copper", height: 1 },
  { symbol: "¥", metal: "silver", height: 2 },
];

// Geometry of one coin, seen from above at an angle: an elliptical face and
// a band of thickness under it.
const W = 64;
const CX = W / 2;
const RX = 28;
const RY = 18;
const T = 7;
const H = 4 + RY * 2 + T * 3 + 10;
const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/** The y of the face ellipse's lower outline at x. */
function lowerY(cy: number, x: number) {
  return cy + RY * Math.sqrt(Math.max(0, 1 - ((x - CX) / RX) ** 2));
}

/** One pile: `height` coins, the top one showing its face and symbol. */
function Pile({
  symbol,
  metal,
  height,
  id,
}: {
  symbol: string;
  metal: Metal;
  height: number;
  id: string;
}) {
  const m = METALS[metal];
  const bottomCy = H - 10 - T - RY;
  const layers = Array.from({ length: height }, (_, i) => bottomCy - i * T);
  const topCy = layers[layers.length - 1];
  const ridges = Array.from({ length: 23 }, (_, i) => CX - RX + 2 + i * ((RX * 2 - 4) / 22));
  const size = symbol.length > 1 ? 15 : 22;

  return (
    <svg className="pile" viewBox={`-5 0 ${W + 10} ${H}`} aria-hidden="true">
      <defs>
        {/* The band: light catching the middle of the curve, dark at the sides. */}
        <linearGradient id={`${id}-edge`} x1="0" x2="1">
          <stop offset="0" stopColor={m.deep} />
          <stop offset="0.22" stopColor={m.shade} />
          <stop offset="0.4" stopColor={m.hi} />
          <stop offset="0.62" stopColor={m.body} />
          <stop offset="1" stopColor={m.deep} />
        </linearGradient>
        <radialGradient id={`${id}-face`} cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor={m.hi} />
          <stop offset="0.5" stopColor={m.body} />
          <stop offset="1" stopColor={m.shade} />
        </radialGradient>
        <radialGradient id={`${id}-field`} cx="0.6" cy="0.7" r="0.9">
          <stop offset="0" stopColor={m.hi} stopOpacity="0.7" />
          <stop offset="0.6" stopColor={m.body} />
          <stop offset="1" stopColor={m.shade} />
        </radialGradient>
        {/* Bevels: the rim is lit from the top left, the sunken field the other way. */}
        <linearGradient id={`${id}-rim`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={m.hi} />
          <stop offset="1" stopColor={m.deep} />
        </linearGradient>
        <linearGradient id={`${id}-well`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={m.deep} />
          <stop offset="1" stopColor={m.hi} />
        </linearGradient>
        <linearGradient id={`${id}-relief`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={m.shade} />
          <stop offset="1" stopColor={m.deep} />
        </linearGradient>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      {/* Contact shadow on the table. */}
      <ellipse
        cx={CX + 2}
        cy={bottomCy + T + 4}
        rx={RX + 1}
        ry={RY - 4}
        fill="rgba(15, 23, 42, 0.32)"
        filter={`url(#${id}-blur)`}
      />

      {layers.map((cy) => (
        <g key={cy}>
          <path
            d={`M ${CX - RX} ${cy} V ${cy + T} A ${RX} ${RY} 0 0 0 ${CX + RX} ${cy + T} V ${cy} A ${RX} ${RY} 0 0 1 ${CX - RX} ${cy} Z`}
            fill={`url(#${id}-edge)`}
          />
          {/* Reeding on the edge. */}
          {ridges.map((x) => (
            <line
              key={x}
              x1={x}
              x2={x}
              y1={lowerY(cy, x) + 0.6}
              y2={lowerY(cy, x) + T - 0.4}
              stroke={m.deep}
              strokeOpacity="0.28"
              strokeWidth="0.7"
            />
          ))}
          <ellipse cx={CX} cy={cy} rx={RX} ry={RY} fill={`url(#${id}-face)`} />
        </g>
      ))}

      {/* The top face: raised rim, sunken field, embossed symbol. */}
      <ellipse
        cx={CX}
        cy={topCy}
        rx={RX - 1.2}
        ry={RY - 0.8}
        fill="none"
        stroke={`url(#${id}-rim)`}
        strokeWidth="2.2"
      />
      <ellipse cx={CX} cy={topCy} rx={RX - 5} ry={RY - 3.4} fill={`url(#${id}-field)`} />
      <ellipse
        cx={CX}
        cy={topCy}
        rx={RX - 5}
        ry={RY - 3.4}
        fill="none"
        stroke={`url(#${id}-well)`}
        strokeWidth="1.4"
      />
      <g transform={`translate(${CX} ${topCy}) scale(1 ${RY / RX + 0.08})`}>
        <text
          x="-0.9"
          y="-1"
          textAnchor="middle"
          dominantBaseline="central"
          fontWeight="800"
          fontSize={size}
          fill={m.hi}
          style={MONO}
        >
          {symbol}
        </text>
        <text
          x="1"
          y="1.4"
          textAnchor="middle"
          dominantBaseline="central"
          fontWeight="800"
          fontSize={size}
          fill={m.deep}
          fillOpacity="0.75"
          style={MONO}
        >
          {symbol}
        </text>
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontWeight="800"
          fontSize={size}
          fill={`url(#${id}-relief)`}
          style={MONO}
        >
          {symbol}
        </text>
      </g>

      {/* Specular glint along the rim. */}
      <path
        d={`M ${CX - RX + 6} ${topCy - 6} A ${RX - 4} ${RY - 3} 0 0 1 ${CX - 2} ${topCy - RY + 2.4}`}
        fill="none"
        stroke="#fff"
        strokeOpacity="0.85"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * A handful of coins in small piles, one per currency: drawn in vector with
 * real thickness, a reeded edge, a bevelled rim and an embossed symbol.
 */
export function CoinPiles() {
  return (
    <div className="piles">
      {PILES.map((pile, i) => (
        <Pile key={pile.symbol} id={`coin-${i}`} {...pile} />
      ))}
      <style jsx>{`
        .piles {
          display: flex;
          align-items: flex-end;
          padding-left: 2px;
        }

        .piles :global(.pile) {
          width: 68px;
          height: auto;
          flex-shrink: 0;
          margin-left: -14px;
        }

        .piles :global(.pile:first-child) {
          margin-left: 0;
        }
      `}</style>
    </div>
  );
}
