import dynamic from "next/dynamic";
import { useDateFormat } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import { ADMIN_MESSAGES } from "../messages";
import type { WeekCount } from "../types";

const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), {
  ssr: false,
});

// "2026-10-19" read as a local calendar day, not UTC midnight.
const toDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** One bar per week; a single series, so no legend — the title names it. */
export function SignupsChart({ weeks, height = 200 }: { weeks: WeekCount[]; height?: number }) {
  const t = useT(ADMIN_MESSAGES);
  const { formatDate } = useDateFormat();
  const data = weeks.map((w) => ({
    key: w.weekStart,
    label: formatDate(toDay(w.weekStart), "day"),
    count: w.count,
  }));

  return (
    <div className="chart">
      <ul className="sr-only" aria-label={t("chart.weeklyTotals")}>
        {data.map((d) => (
          <li key={d.key}>
            {t("chart.week", { date: d.label })}: {t("chart.signups", { count: d.count })}
          </li>
        ))}
      </ul>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
          barCategoryGap="24%"
        >
          <CartesianGrid strokeDasharray="4 4" stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--fg-2)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--fg-2)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
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
            itemStyle={{ color: "var(--fg-0)" }}
            labelFormatter={(label) => t("chart.week", { date: String(label) })}
            formatter={(v) => [t("chart.signups", { count: Number(v) }), ""]}
            separator=""
          />
          <Bar
            dataKey="count"
            fill="var(--palette-1)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
      <style jsx>{`
        .chart {
          min-width: 0;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
