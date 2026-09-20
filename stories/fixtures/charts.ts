/**
 * Chart inputs derived from the ledger with the same helpers the pages use,
 * so a chart story shows what the real screen would.
 */
import type { BarSeries, MonthBar } from "../../components/molecules/MonthlyBarsChart";
import { toFlowSeries } from "../../helpers/chartData";
import type { FlowPoint } from "../../helpers/chartData";
import { monthTotalsByCategory } from "../../helpers/stacks";
import { cashFlowSeries } from "../../features/dashboard/helpers/cashFlowSeries";
import type { CashFlowGroupBy } from "../../features/dashboard/helpers/cashFlowSeries";
import { monthTotals, monthWindows, monthDelta } from "../../features/domains/helpers/months";
import type { MonthWindow } from "../../features/domains/helpers/months";
import { DOMAIN_CONFIG } from "../../features/domains/helpers/domainConfig";
import type { Domain } from "../../types";
import { DEFAULT_MONTH_PERIOD } from "../../constants";
import { STORY_CATEGORIES } from "./categories";
import { STORY_CTX } from "./rates";
import { NOW } from "./time";
import { STORY_TRANSACTIONS, transactionsFor } from "./transactions";

/** The months a domain page charts by default, oldest first. */
export const STORY_WINDOWS: MonthWindow[] = monthWindows(DEFAULT_MONTH_PERIOD, NOW);
export const CURRENT_WINDOW: MonthWindow = STORY_WINDOWS[STORY_WINDOWS.length - 1];

/** One bar per month for a domain, stacked by its top categories. */
export function domainBars(domain: Domain, top = 5): { data: MonthBar[]; series: BarSeries[] } {
  const rows = transactionsFor(domain);
  const stacks = monthTotalsByCategory(rows, STORY_CATEGORIES, STORY_CTX, STORY_WINDOWS, {
    domain,
    top,
  });
  const config = DOMAIN_CONFIG[domain];
  const series: BarSeries[] =
    stacks.series.length > 0
      ? stacks.series
      : [{ key: "amount", label: config.spentLabel, color: config.accent }];
  const data: MonthBar[] = STORY_WINDOWS.map((w) => ({
    key: w.key,
    label: w.label,
    isCurrent: w.isCurrent,
    ...Object.fromEntries(series.map((s) => [s.key, stacks.totals[w.key]?.[s.key] ?? 0])),
    ...(w.isCurrent ? { planned: 480 } : {}),
  }));
  return { data, series };
}

export function domainTotals(domain: Domain) {
  const totals = monthTotals(transactionsFor(domain), STORY_CTX, STORY_WINDOWS);
  return { totals, delta: monthDelta(totals, STORY_WINDOWS, CURRENT_WINDOW.key) };
}

/** The dashboard's five-domain cash flow for the last `months` months. */
export function cashFlow(months = 6, groupBy: CashFlowGroupBy = "domain") {
  const windows = monthWindows(months, NOW);
  const byDomain = {
    INCOME: transactionsFor("INCOME"),
    EXPENSE: transactionsFor("EXPENSE"),
    INVESTMENT: transactionsFor("INVESTMENT"),
    SAVING: transactionsFor("SAVING"),
    DEBT: transactionsFor("DEBT"),
  };
  return cashFlowSeries(byDomain, STORY_CATEGORIES, STORY_CTX, windows, { groupBy, top: 5 });
}

/** Income vs expense per month over the ledger, as FlowChart wants it. */
export const STORY_FLOW: FlowPoint[] = toFlowSeries(STORY_TRANSACTIONS, {
  ...STORY_CTX,
  from: STORY_WINDOWS[0].start,
  to: NOW,
  bucket: "month",
});

/** A cumulative projection like the Prospect page draws. */
export const STORY_PROJECTION: FlowPoint[] = Array.from({ length: 12 }, (_, i) => {
  const date = new Date(NOW.getFullYear(), NOW.getMonth() + i + 1, 1);
  const label = date.toLocaleDateString("en", { month: "short" });
  return { label, income: 1240 * (i + 1), expense: 1240 * (i + 1) + 210 * (i + 1) };
});
