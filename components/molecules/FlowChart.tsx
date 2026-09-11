import dynamic from "next/dynamic";
import { formatAmount, formatCompact } from "../atoms/Amount";
import type { FlowPoint } from "../../helpers/chartData";
import type { Currency } from "../../types";

// recharts is client-only and heavy, so every piece is loaded on demand.
const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), {
  ssr: false,
});

interface Props {
  data: FlowPoint[];
  currency: Currency;
  loading: boolean;
  height?: number;
  /** Override the two series' legend/tooltip labels — default "Income"/"Expenses". */
  labelA?: string;
  labelB?: string;
  /** Override the two series' colors — default the income/expense domain tokens. */
  colorA?: string;
  colorB?: string;
  /** "stepAfter" for running totals, where a salary is a jump on one day. */
  curve?: "monotone" | "stepAfter";
}

/**
 * Two-series area chart over time. Defaults to income vs expense (the
 * dashboard's Cash flow panel); Prospect reuses it for a current-vs-adjusted
 * net comparison by overriding the labels and colors — the underlying
 * `income`/`expense` data keys stay the same either way.
 */
export function FlowChart({
  data,
  currency,
  loading,
  height = 240,
  labelA = "Income",
  labelB = "Expenses",
  colorA = "var(--domain-income)",
  colorB = "var(--domain-expense)",
  curve = "monotone",
}: Props) {
  const hasMoney = data.some((p) => p.income !== 0 || p.expense !== 0);

  return (
    <div className="chart-area">
      {!loading && !hasMoney ? (
        <p className="empty">No transactions in this period</p>
      ) : (
        <>
          <div className="legend">
            <span className="key">
              <span className="dot" style={{ background: colorA }} />
              {labelA}
            </span>
            <span className="key">
              <span className="dot" style={{ background: colorB }} />
              {labelB}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="flowAGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorA} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={colorA} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="flowBGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorB} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={colorB} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--line)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--fg-2)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "var(--fg-2)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatCompact(v, currency)}
                width={68}
              />
              <Tooltip
                cursor={{ stroke: "var(--line-strong)", strokeDasharray: "4 4" }}
                contentStyle={{
                  background: "var(--bg-1)",
                  border: "1px solid var(--line-strong)",
                  borderRadius: 10,
                  fontSize: 13,
                  padding: "10px 14px",
                }}
                labelStyle={{ color: "var(--fg-2)", marginBottom: 4 }}
                formatter={(v, name, entry) => {
                  const total = typeof v === "number" ? formatAmount(v, currency) : String(v);
                  const point = (entry as { payload?: FlowPoint }).payload;
                  const added = name === "income" ? point?.incomeAdded : point?.expenseAdded;
                  const label = name === "income" ? labelA : labelB;
                  // Cumulative series: say what this bucket alone contributed,
                  // otherwise the flat stretches look like missing data.
                  if (added === undefined) return [total, label];
                  return [
                    added > 0 ? `${total} · +${formatAmount(added, currency)}` : total,
                    label,
                  ];
                }}
              />
              <Area
                type={curve}
                dataKey="income"
                stroke={colorA}
                strokeWidth={2}
                fill="url(#flowAGrad)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: colorA,
                  stroke: "var(--bg-1)",
                  strokeWidth: 2,
                }}
              />
              <Area
                type={curve}
                dataKey="expense"
                stroke={colorB}
                strokeWidth={2}
                fill="url(#flowBGrad)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: colorB,
                  stroke: "var(--bg-1)",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </>
      )}

      <style jsx>{`
        .chart-area {
          padding: 8px 0;
        }

        .legend {
          display: flex;
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

        .empty {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }
      `}</style>
    </div>
  );
}
