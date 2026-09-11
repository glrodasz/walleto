import type { MoneyFlow } from "./aggregations";

export type AllocationKey = "expenses" | "investments" | "savings" | "left";

export interface AllocationSegment {
  key: AllocationKey;
  /** Share of the month's income, 0–1. The segments add up to 1. */
  share: number;
}

/**
 * How the month's income is spoken for: expenses, investments, savings, and
 * what is left. When the plan spends more than it earns the three outflows
 * fill the whole bar (scaled to the outflow) and there is no "left" slice.
 */
export function allocationSegments(flow: MoneyFlow): AllocationSegment[] {
  const out = flow.expenses + flow.investments + flow.savings;
  const base = Math.max(flow.income, out);
  if (base <= 0) return [];
  const share = (v: number) => Math.max(0, v) / base;
  const segments: AllocationSegment[] = [
    { key: "expenses", share: share(flow.expenses) },
    { key: "investments", share: share(flow.investments) },
    { key: "savings", share: share(flow.savings) },
    { key: "left", share: share(flow.income - out) },
  ];
  return segments.filter((s) => s.share > 0);
}
