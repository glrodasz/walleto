import { formatDate } from "../../../helpers/dates";
import type { FlowPoint } from "../../../helpers/chartData";

/**
 * Cumulative cash position over the next `months`, with and without the
 * hypothetical cancellations — two straight-ish lines whose growing gap is
 * the point: `freedMonthly` compounds every month it stays cancelled.
 * Reuses FlowChart's {label, income, expense} shape; the caller relabels
 * the series ("Current" / "If cancelled") rather than Income/Expenses.
 */
export function buildWhatIfProjection(
  currentMonthlyNet: number,
  freedMonthly: number,
  months: number,
  now: Date = new Date()
): FlowPoint[] {
  const points: FlowPoint[] = [];
  for (let i = 1; i <= months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    points.push({
      label: formatDate(date, "month"),
      income: currentMonthlyNet * i,
      expense: (currentMonthlyNet + freedMonthly) * i,
    });
  }
  return points;
}
