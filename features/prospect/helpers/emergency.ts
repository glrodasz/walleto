import { convert } from "../../../helpers/fx";
import type { MoneyContext } from "../../../helpers/aggregations";
import type { EmergencyPlan } from "../../../types";
import type { FlowPoint } from "../../../helpers/chartData";
import { formatDate } from "../../../helpers/dates";
import type { CancelableGroups, RankedItem } from "./rankCancelable";

/** How far the simulation looks before calling a runway "10+ years". */
export const RUNWAY_CAP_MONTHS = 120;

const sum = (rows: RankedItem[]) => rows.reduce((acc, r) => acc + r.monthly, 0);

export interface EmergencyBudget {
  /** Essential expenses per month. */
  essentialMonthly: number;
  /** Debt repayments per month — always kept. */
  debtMonthly: number;
  /** What leaves every month in emergency mode: essentials + debt. */
  burnMonthly: number;
  /** Non-essential spending emergency mode cancels. */
  pausedSpending: number;
  /** Investment and saving contributions emergency mode stops. */
  pausedContributions: number;
  /** The plan's outflow today, nothing paused: the "keep everything" baseline. */
  fullMonthly: number;
}

export function emergencyBudget(groups: CancelableGroups): EmergencyBudget {
  const essentialMonthly = sum(groups.essential);
  const debtMonthly = sum(groups.debts);
  const pausedSpending = sum(groups.nonEssential);
  const pausedContributions = sum(groups.contributions);
  const burnMonthly = essentialMonthly + debtMonthly;
  return {
    essentialMonthly,
    debtMonthly,
    burnMonthly,
    pausedSpending,
    pausedContributions,
    fullMonthly: burnMonthly + pausedSpending + pausedContributions,
  };
}

/** The emergency plan's amounts in ctx.target, the currency everything else is in. */
export function planInTarget(
  plan: EmergencyPlan,
  ctx: MoneyContext
): Pick<EmergencyPlan, "benefitMonthly" | "benefitMonths" | "severance"> {
  return {
    benefitMonthly: convert(plan.benefitMonthly, plan.currency, ctx.target, ctx.rates),
    benefitMonths: plan.benefitMonths,
    severance: convert(plan.severance, plan.currency, ctx.target, ctx.rates),
  };
}

export interface RunwayInput {
  /** Cash on hand today: savings, plus investments when the owner counts them. */
  cushion: number;
  burnMonthly: number;
  benefitMonthly: number;
  benefitMonths: number;
  /** One-off, lands on day one. */
  severance: number;
}

/** What leaves the cushion in month `i` (0-based): the burn, less any benefit still paying. */
function drawIn(input: RunwayInput, i: number): number {
  return input.burnMonthly - (i < input.benefitMonths ? input.benefitMonthly : 0);
}

/**
 * How many months the cushion lasts: fractional, so "4.5" means it runs out
 * halfway through the fifth month. `null` when it outlasts
 * RUNWAY_CAP_MONTHS — including when nothing is being spent at all.
 *
 * Month by month rather than a division, because the benefit stops: while it
 * pays, a month may even top the cushion up.
 */
export function runwayMonths(input: RunwayInput, cap = RUNWAY_CAP_MONTHS): number | null {
  let balance = input.cushion + input.severance;
  for (let i = 0; i < cap; i++) {
    const draw = drawIn(input, i);
    if (draw > 0 && balance < draw) return i + Math.max(0, balance) / draw;
    balance -= draw;
  }
  return null;
}

/** The cushion at the end of each month, 0..months (0 is today, severance in). Never below zero. */
export function balanceSeries(input: RunwayInput, months: number): number[] {
  const out: number[] = [];
  let balance = input.cushion + input.severance;
  out.push(Math.max(0, balance));
  for (let i = 0; i < months; i++) {
    balance -= drawIn(input, i);
    out.push(Math.max(0, balance));
  }
  return out;
}

/** Long enough to see the emergency line hit zero, short enough to stay readable. */
export function chartHorizon(runway: number | null): number {
  if (runway === null) return 24;
  return Math.min(60, Math.max(6, Math.ceil(runway) + 2));
}

/**
 * The cushion draining month by month, keeping everything vs. in emergency
 * mode. Reuses FlowChart's {label, income, expense} shape: the caller labels
 * "income" as the keep-everything line and "expense" as the emergency one.
 */
export function emergencyProjection(
  keepEverything: RunwayInput,
  emergency: RunwayInput,
  months: number,
  now: Date = new Date()
): FlowPoint[] {
  const a = balanceSeries(keepEverything, months);
  const b = balanceSeries(emergency, months);
  return a.map((value, i) => ({
    label:
      i === 0 ? "Now" : formatDate(new Date(now.getFullYear(), now.getMonth() + i, 1), "month"),
    income: value,
    expense: b[i],
  }));
}
