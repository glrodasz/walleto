import dynamic from "next/dynamic";
import { formatAmount, formatCompact } from "../atoms/Amount";
import type { Currency } from "../../types";

// recharts is client-only and heavy, so every piece is loaded on demand.
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), {
  ssr: false,
});
const ReferenceLine = dynamic(() => import("recharts").then((m) => m.ReferenceLine), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), {
  ssr: false,
});

export interface MonthBar {
  /** Stable identity ("2026-09"); selection and clicks speak in keys. */
  key: string;
  label: string;
  /** The month still in progress — drawn lighter, may carry `planned`. */
  isCurrent?: boolean;
  /** Still-to-come amount stacked on the first series with a hatched fill. */
  planned?: number;
  [series: string]: number | string | boolean | undefined;
}

export interface BarSeries {
  key: string;
  label: string;
  color: string;
}

interface Props {
  data: MonthBar[];
  series: BarSeries[];
  currency: Currency;
  loading: boolean;
  /** Dashed benchmark line ("avg"). */
  average?: number | null;
  selectedKey?: string;
  onSelect?: (key: string) => void;
  height?: number;
  /** Stack every series into one bar (e.g. one segment per currency). */
  stacked?: boolean;
}

const HATCH_ID = "monthly-bars-hatch";

/**
 * One bar per month — the shape money actually has. The month in progress is
 * lighter so it never reads as a finished month, and can carry a hatched
 * "still planned" segment on top of what already landed. A dashed average
 * line turns each bar into a judgement: above or below normal.
 */
export function MonthlyBarsChart({
  data,
  series,
  currency,
  loading,
  average,
  selectedKey,
  onSelect,
  height = 220,
  stacked = false,
}: Props) {
  const hasMoney = data.some(
    (d) => series.some((s) => Number(d[s.key]) !== 0) || (d.planned ?? 0) !== 0
  );
  const primary = series[0];
  const hasPlanned = data.some((d) => (d.planned ?? 0) > 0);

  return (
    <div className="chart-area">
      {!loading && !hasMoney ? (
        <p className="empty">No transactions in this period</p>
      ) : (
        <>
          <div className="legend">
            {series.map((s) => (
              <span className="key" key={s.key}>
                <span className="dot" style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
            {hasPlanned && (
              <span className="key">
                <span className="dot hatched" style={{ borderColor: primary.color }} />
                Still planned
              </span>
            )}
            {average !== null && average !== undefined && (
              <span className="key">
                <span className="dash" />
                Avg {formatCompact(average, currency)}
              </span>
            )}
          </div>

          {/* The same numbers, readable without the SVG (and by tests). */}
          <ul className="sr-only" aria-label="Monthly totals">
            {data.map((d) => (
              <li key={d.key}>
                {d.label}:{" "}
                {series
                  .map((s) => `${s.label} ${formatAmount(Number(d[s.key] ?? 0), currency)}`)
                  .join(", ")}
                {d.planned ? `, still planned ${formatAmount(d.planned, currency)}` : ""}
                {d.isCurrent ? " (in progress)" : ""}
              </li>
            ))}
          </ul>

          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={data}
              margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
              barCategoryGap="28%"
              barGap={3}
            >
              <defs>
                <pattern
                  id={HATCH_ID}
                  patternUnits="userSpaceOnUse"
                  width="6"
                  height="6"
                  patternTransform="rotate(45)"
                >
                  <line x1="0" y1="0" x2="0" y2="6" stroke={primary.color} strokeWidth="2" />
                </pattern>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--line)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--fg-2)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fill: "var(--fg-2)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatCompact(v, currency)}
                width={64}
              />
              <Tooltip
                cursor={{ fill: "var(--bg-2)", opacity: 0.5 }}
                contentStyle={{
                  background: "var(--bg-1)",
                  border: "1px solid var(--line-strong)",
                  borderRadius: 10,
                  fontSize: 13,
                  padding: "10px 14px",
                }}
                labelStyle={{ color: "var(--fg-2)", marginBottom: 4 }}
                formatter={(v, name) => {
                  const amount = typeof v === "number" ? formatAmount(v, currency) : String(v);
                  if (name === "planned") return [amount, "Still planned"];
                  return [amount, series.find((s) => s.key === name)?.label ?? String(name)];
                }}
              />
              {average !== null && average !== undefined && (
                <ReferenceLine
                  y={average}
                  stroke="var(--fg-2)"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                />
              )}
              {series.map((s, i) => {
                const inStack = stacked || i === 0;
                const topOfStack = stacked ? i === series.length - 1 : i === 0;
                const rounded = !inStack || (topOfStack && !hasPlanned);
                return (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    stackId={inStack ? "primary" : undefined}
                    fill={s.color}
                    radius={rounded ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                    isAnimationActive={false}
                    onClick={(_entry, index) => {
                      const bar = data[index];
                      if (bar && onSelect) onSelect(bar.key);
                    }}
                    cursor={onSelect ? "pointer" : undefined}
                  >
                    {data.map((d) => (
                      <Cell
                        key={d.key}
                        fillOpacity={
                          (d.isCurrent ? 0.55 : 1) *
                          (selectedKey && d.key !== selectedKey ? 0.45 : 1)
                        }
                      />
                    ))}
                  </Bar>
                );
              })}
              {hasPlanned && (
                <Bar
                  dataKey="planned"
                  stackId="primary"
                  fill={`url(#${HATCH_ID})`}
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={false}
                  onClick={(_entry, index) => {
                    const bar = data[index];
                    if (bar && onSelect) onSelect(bar.key);
                  }}
                  cursor={onSelect ? "pointer" : undefined}
                >
                  {data.map((d) => (
                    <Cell
                      key={d.key}
                      fillOpacity={selectedKey && d.key !== selectedKey ? 0.45 : 1}
                    />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      <style jsx>{`
        .chart-area {
          padding: 8px 0;
        }

        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 4px;
        }

        .key {
          font-size: 0.75rem;
          color: var(--fg-2);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .dot.hatched {
          border-radius: 2px;
          border: 1px solid;
          background: repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 3px);
          color: var(--fg-2);
        }

        .dash {
          width: 14px;
          border-top: 2px dashed var(--fg-2);
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .empty {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }
      `}</style>
    </div>
  );
}
