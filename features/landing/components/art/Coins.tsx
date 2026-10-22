type Metal = "gold" | "silver" | "copper";

/** Highlight, body, shade and deep-shadow tones of each metal. */
const METALS: Record<Metal, { hi: string; body: string; shade: string; deep: string }> = {
  gold: { hi: "#fff4c8", body: "#f1bd3f", shade: "#c98c1e", deep: "#7d4f0e" },
  silver: { hi: "#ffffff", body: "#d9dfe7", shade: "#9ea9b8", deep: "#5a6577" },
  copper: { hi: "#ffd9bd", body: "#e3905f", shade: "#b5602e", deep: "#62290c" },
};

const COINS: { symbol: string; metal: Metal; tilt: number }[] = [
  { symbol: "$", metal: "gold", tilt: -10 },
  { symbol: "€", metal: "silver", tilt: -5 },
  { symbol: "£", metal: "gold", tilt: -8 },
  { symbol: "kr", metal: "copper", tilt: -4 },
  { symbol: "¥", metal: "silver", tilt: -9 },
];

// Each coin stands on its edge, turned a little so its thickness shows on
// the right: an upright elliptical face, and the same ellipse pushed right
// for the reeded edge.
const RX = 25;
const RY = 30;
const DEPTH = 8;
const STEP = 53;
const CY = 38;
const FLOOR = CY + RY + 2;
const WIDTH = 36 + STEP * (COINS.length - 1) + RX + DEPTH + 6;
const HEIGHT = FLOOR + 24;
/** Angles around the rim for the edge's ridges: denser where the curve turns away. */
const RIDGES = Array.from({ length: 34 }, (_, i) => (Math.PI * (i + 0.5)) / 34);
const SANS = { fontFamily: "Inter, system-ui, sans-serif" };

function MetalDefs({ metal }: { metal: Metal }) {
  const m = METALS[metal];
  return (
    <>
      {/* Brushed face: alternating bands of light across the diagonal. */}
      <linearGradient id={`face-${metal}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={m.hi} />
        <stop offset="0.22" stopColor={m.body} />
        <stop offset="0.46" stopColor={m.shade} />
        <stop offset="0.6" stopColor={m.hi} />
        <stop offset="0.8" stopColor={m.body} />
        <stop offset="1" stopColor={m.shade} />
      </linearGradient>
      <radialGradient id={`field-${metal}`} cx="0.35" cy="0.3" r="0.85">
        <stop offset="0" stopColor={m.hi} />
        <stop offset="0.55" stopColor={m.body} />
        <stop offset="1" stopColor={m.shade} />
      </radialGradient>
      <linearGradient id={`edge-${metal}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={m.body} />
        <stop offset="0.35" stopColor={m.hi} />
        <stop offset="0.7" stopColor={m.shade} />
        <stop offset="1" stopColor={m.deep} />
      </linearGradient>
      {/* Rim bevel: lit top-left, shaded bottom-right; the inner step the other way. */}
      <linearGradient id={`rim-${metal}`} x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={m.hi} />
        <stop offset="0.5" stopColor={m.body} />
        <stop offset="1" stopColor={m.deep} />
      </linearGradient>
      <linearGradient id={`step-${metal}`} x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={m.deep} />
        <stop offset="1" stopColor={m.hi} />
      </linearGradient>
      <linearGradient id={`relief-${metal}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={m.hi} />
        <stop offset="0.5" stopColor={m.body} />
        <stop offset="1" stopColor={m.shade} />
      </linearGradient>
    </>
  );
}

function Coin({
  symbol,
  metal,
  tilt,
  cx,
}: {
  symbol: string;
  metal: Metal;
  tilt: number;
  cx: number;
}) {
  const m = METALS[metal];
  const size = symbol.length > 1 ? 24 : 34;
  const glyph = (dx: number, dy: number, fill: string, opacity = 1) => (
    <text
      x={dx}
      y={dy}
      textAnchor="middle"
      dominantBaseline="central"
      fontWeight="800"
      fontSize={size}
      fill={fill}
      fillOpacity={opacity}
      style={SANS}
    >
      {symbol}
    </text>
  );
  return (
    <g transform={`rotate(${tilt} ${cx} ${FLOOR})`}>
      {/* Thickness: a solid band, then the reeding across it. */}
      <ellipse cx={cx + DEPTH} cy={CY} rx={RX} ry={RY} fill={m.deep} />
      {Array.from({ length: DEPTH }, (_, i) => (
        <ellipse key={i} cx={cx + DEPTH - i} cy={CY} rx={RX} ry={RY} fill={`url(#edge-${metal})`} />
      ))}
      {RIDGES.map((theta) => {
        const y = CY - RY * Math.cos(theta);
        const x = cx + RX * Math.sin(theta);
        return (
          <line
            key={theta}
            x1={x}
            x2={x + DEPTH}
            y1={y}
            y2={y}
            stroke={m.deep}
            strokeOpacity="0.45"
            strokeWidth="0.7"
          />
        );
      })}

      {/* Face: brushed metal, a bevelled rim and a sunken field. */}
      <ellipse cx={cx} cy={CY} rx={RX} ry={RY} fill={`url(#face-${metal})`} />
      <ellipse
        cx={cx}
        cy={CY}
        rx={RX - 1.3}
        ry={RY - 1.3}
        fill="none"
        stroke={`url(#rim-${metal})`}
        strokeWidth="2.6"
      />
      <ellipse cx={cx} cy={CY} rx={RX - 4.2} ry={RY - 4.4} fill={`url(#field-${metal})`} />
      <ellipse
        cx={cx}
        cy={CY}
        rx={RX - 4.2}
        ry={RY - 4.4}
        fill="none"
        stroke={`url(#step-${metal})`}
        strokeWidth="1.2"
      />

      {/* Raised symbol: drop shade right and down, light catch left and up. */}
      <g transform={`translate(${cx} ${CY + 1}) scale(${RX / RY + 0.05} 1)`}>
        {glyph(1.6, 1.8, m.deep, 0.7)}
        {glyph(-0.8, -0.9, m.hi)}
        {glyph(0, 0, `url(#relief-${metal})`)}
      </g>

      {/* Specular streak across the upper left of the rim. */}
      <path
        d={`M ${cx - RX + 4} ${CY - 8} A ${RX - 3} ${RY - 3} 0 0 1 ${cx - 4} ${CY - RY + 3.2}`}
        fill="none"
        stroke="#fff"
        strokeOpacity="0.9"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * Five coins standing in a row, one per currency, drawn in vector to look
 * like metal: a turned face with a reeded edge, a bevelled rim, a raised
 * symbol, and their reflection on the table.
 */
export function CoinRow() {
  const xs = COINS.map((_, i) => 36 + i * STEP);
  return (
    <svg className="coins" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
      <defs>
        {(["gold", "silver", "copper"] as const).map((metal) => (
          <MetalDefs key={metal} metal={metal} />
        ))}
        <filter id="coin-shadow" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id="coin-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask
          id="coin-reflection"
          maskUnits="userSpaceOnUse"
          x="0"
          y={FLOOR}
          width={WIDTH}
          height={HEIGHT - FLOOR}
        >
          <rect x="0" y={FLOOR} width={WIDTH} height={HEIGHT - FLOOR} fill="url(#coin-fade)" />
        </mask>
        {/* Drawn right to left, so each coin's edge tucks behind its left neighbour. */}
        <g id="coin-row">
          {COINS.map((coin, i) => ({ coin, x: xs[i] }))
            .reverse()
            .map(({ coin, x }) => (
              <Coin key={coin.symbol} cx={x} {...coin} />
            ))}
        </g>
      </defs>

      <g mask="url(#coin-reflection)">
        <use href="#coin-row" transform={`translate(0 ${FLOOR * 2}) scale(1 -1)`} />
      </g>
      {xs.map((x) => (
        <ellipse
          key={x}
          cx={x + DEPTH / 2}
          cy={FLOOR - 1}
          rx={RX - 2}
          ry="3.5"
          fill="rgba(15, 23, 42, 0.35)"
          filter="url(#coin-shadow)"
        />
      ))}
      <use href="#coin-row" />
      <style jsx>{`
        .coins {
          display: block;
          width: 100%;
          max-width: 320px;
          height: auto;
        }
      `}</style>
    </svg>
  );
}
