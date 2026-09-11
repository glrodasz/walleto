import { CURRENCY_COLORS } from "../../../constants";
import type { MoneyContext } from "../../../helpers/aggregations";
import { domainAccent, monthTotalsBy, monthTotalsByCategory } from "../../../helpers/stacks";
import type { StackSeries, StackedTotals } from "../../../helpers/stacks";
import type { MonthWindow } from "../../domains/helpers/months";
import type { Category, Currency, Domain, Transaction } from "../../../types";

export type CashFlowGroupBy = "domain" | "category" | "currency";

export const CASH_FLOW_DOMAINS: Domain[] = ["INCOME", "EXPENSE", "INVESTMENT", "SAVING"];

const DOMAIN_LABEL: Record<Domain, string> = {
  INCOME: "Income",
  EXPENSE: "Expenses",
  INVESTMENT: "Investments",
  SAVING: "Savings",
};

/** One bar per month per group; each bar is a stack of the group's series. */
export interface CashFlowGroup {
  key: Domain;
  label: string;
  color: string;
  series: StackSeries[];
}

export interface GroupedBar {
  key: string;
  label: string;
  isCurrent?: boolean;
  /** Flat recharts keys: `${group.key}:${series.key}`. */
  [flatKey: string]: number | string | boolean | undefined;
}

export const flatKey = (group: string, series: string) => `${group}:${series}`;

/**
 * The dashboard's cash flow: four domains side by side per month, each
 * stacked by category (top five + Other), by currency, or not at all. Built
 * from real transactions, unlike the plan cards above it.
 */
export function cashFlowSeries(
  txByDomain: Record<Domain, Transaction[]>,
  categories: Category[],
  ctx: MoneyContext,
  windows: MonthWindow[],
  opts: { groupBy: CashFlowGroupBy; top?: number }
): { data: GroupedBar[]; groups: CashFlowGroup[] } {
  const stacks: Record<Domain, StackedTotals> = {} as Record<Domain, StackedTotals>;

  for (const domain of CASH_FLOW_DOMAINS) {
    const rows = txByDomain[domain] ?? [];
    if (opts.groupBy === "category") {
      stacks[domain] = monthTotalsByCategory(rows, categories, ctx, windows, {
        domain,
        top: opts.top ?? 5,
      });
    } else if (opts.groupBy === "currency") {
      const byCurrency = monthTotalsBy(rows, ctx, windows, (t) => t.currency, {
        label: (c) => c,
        color: () => domainAccent(domain),
      });
      // Colour by the currency itself, not by rank, so a currency keeps its colour across domains.
      stacks[domain] = {
        ...byCurrency,
        series: byCurrency.series.map((s) => ({
          ...s,
          color: CURRENCY_COLORS[s.key as Currency] ?? s.color,
        })),
      };
    } else {
      stacks[domain] = monthTotalsBy(rows, ctx, windows, () => "total", {
        label: () => DOMAIN_LABEL[domain],
        color: () => domainAccent(domain),
      });
      // A domain with no rows at all still needs its one series so the bar exists.
      if (stacks[domain].series.length === 0) {
        stacks[domain].series = [
          { key: "total", label: DOMAIN_LABEL[domain], color: domainAccent(domain) },
        ];
        for (const w of windows) stacks[domain].totals[w.key] = { total: 0 };
      }
    }
  }

  const groups: CashFlowGroup[] = CASH_FLOW_DOMAINS.map((domain) => ({
    key: domain,
    label: DOMAIN_LABEL[domain],
    color: domainAccent(domain),
    series: stacks[domain].series,
  }));

  const data: GroupedBar[] = windows.map((w) => {
    const bar: GroupedBar = { key: w.key, label: w.label, isCurrent: w.isCurrent };
    for (const g of groups) {
      for (const s of g.series)
        bar[flatKey(g.key, s.key)] = stacks[g.key].totals[w.key]?.[s.key] ?? 0;
    }
    return bar;
  });

  return { data, groups };
}
