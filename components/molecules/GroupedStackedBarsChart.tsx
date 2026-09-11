import dynamic from "next/dynamic";
import { formatAmount, formatCompact } from "../atoms/Amount";
import { flatKey } from "../../features/dashboard/helpers/cashFlowSeries";
import type { CashFlowGroup, GroupedBar } from "../../features/dashboard/helpers/cashFlowSeries";
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
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), {
  ssr: false,
});

interface Props {
  data: GroupedBar[];
  groups: CashFlowGroup[];
  currency: Currency;
  loading: boolean;
  selectedKey?: string;
  onSelect?: (key: string) => void;
  height?: number;
}

/**
 * Per month, one bar per group side by side; each bar is a stack of that
 * group's series. Four domains stacked by category is the dashboard's cash
 * flow. Recharts groups bars by `stackId` for free.
 */
export function GroupedStackedBarsChart({
  data,
  groups,
  currency,
  loading,
  selectedKey,
  onSelect,
  height = 260,
}: Props) {
  const keys = groups.flatMap((g) => g.series.map((s) => flatKey(g.key, s.key)));
  const hasMoney = data.some((d) => keys.some((k) => Number(d[k]) !== 0));
  const labelOf = (key: string) => {
    const [groupKey, seriesKey] = key.split(":");
    const group = groups.find((g) => g.key === groupKey);
    const series = group?.series.find((s) => s.key === seriesKey);
    if (!group) return key;
    return series && series.key !== "total" ? `${group.label} · ${series.label}` : group.label;
  };

  return (
    <div className="chart-area">
      {!loading && !hasMoney ? (
        <p className="empty">No transactions in this period</p>
      ) : (
        <>
          {/* The same numbers, readable without the SVG (and by tests). */}
          <ul className="sr-only" aria-label="Monthly cash flow">
            {data.map((d) => (
              <li key={d.key}>
                {d.label}:{" "}
                {groups
                  .map(
                    (g) =>
                      `${g.label} ${formatAmount(
                        g.series.reduce((sum, s) => sum + Number(d[flatKey(g.key, s.key)] ?? 0), 0),
                        currency
                      )}`
                  )
                  .join(", ")}
                {d.isCurrent ? " (in progress)" : ""}
              </li>
            ))}
          </ul>

          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={data}
              margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
              barCategoryGap="22%"
              barGap={4}
            >
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
                formatter={(v, name) => [
                  typeof v === "number" ? formatAmount(v, currency) : String(v),
                  labelOf(String(name)),
                ]}
              />
              {groups.map((g) =>
                g.series.map((s, i) => {
                  const top = i === g.series.length - 1;
                  return (
                    <Bar
                      key={flatKey(g.key, s.key)}
                      dataKey={flatKey(g.key, s.key)}
                      stackId={g.key}
                      fill={s.color}
                      radius={top ? [5, 5, 0, 0] : [0, 0, 0, 0]}
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
                            (d.isCurrent ? 0.7 : 1) *
                            (selectedKey && d.key !== selectedKey ? 0.45 : 1)
                          }
                        />
                      ))}
                    </Bar>
                  );
                })
              )}
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      <style jsx>{`
        .chart-area {
          padding: 4px 0;
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
