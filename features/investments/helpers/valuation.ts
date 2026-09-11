import { formatDate } from "../../../helpers/dates";
import { convertedAmount } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { convert } from "../../../helpers/fx";
import { isAccountDomain } from "../../../helpers/accounts";
import type { FlowPoint } from "../../../helpers/chartData";
import type {
  AccountDomain,
  Category,
  InterestRate,
  InvestmentValuation,
  Transaction,
} from "../../../types";
import { valueAt } from "./interest";
import type { Deposit, ValuePoint } from "./interest";

/**
 * What a value is *of*: an account / pocket, or the domain's "No account"
 * bucket — every entry filed under none. Valuations that predate accounts
 * (a `categoryId`, no `domain`) fall into the bucket of their category's
 * domain; see `valuationDomain`.
 */
export type ValueSelector = { accountId: string } | { domain: AccountDomain };

export function selectorKey(s: ValueSelector): string {
  return "accountId" in s ? `acc:${s.accountId}` : `dom:${s.domain}`;
}

export function matchesSelector(
  row: { accountId?: string; domain?: string },
  s: ValueSelector
): boolean {
  if ("accountId" in s) return row.accountId === s.accountId;
  return !row.accountId && row.domain === s.domain;
}

/**
 * The domain a valuation belongs to. New ones carry it; the ones written
 * before accounts existed only name a category — resolve through it, and
 * fall back to INVESTMENT, the only domain that had valuations back then.
 */
export function valuationDomain(
  v: Pick<InvestmentValuation, "domain" | "categoryId">,
  categories: Pick<Category, "id" | "domain">[] = []
): AccountDomain {
  if (v.domain) return v.domain;
  const viaCategory = categories.find((c) => c.id === v.categoryId)?.domain;
  return viaCategory === "SAVING" ? "SAVING" : "INVESTMENT";
}

/** Every valuation with its domain filled in, so selectors can match it. */
export function withDomain(
  valuations: InvestmentValuation[],
  categories: Pick<Category, "id" | "domain">[] = []
): InvestmentValuation[] {
  return valuations.map((v) => (v.domain ? v : { ...v, domain: valuationDomain(v, categories) }));
}

/** Value implied by a gain: 0% leaves the basis alone, +100% doubles it. */
export function valueFromGain(costBasis: number, gainPct: number): number {
  return costBasis * (1 + gainPct / 100);
}

/** Gain implied by a value; null when there's no basis to compare against. */
export function gainFromValue(costBasis: number, value: number): number | null {
  if (costBasis <= 0) return null;
  return ((value - costBasis) / costBasis) * 100;
}

function occurred(t: Transaction): Date {
  return t.occurredAt.toDate();
}

/**
 * Every PAID contribution matching the selector, converted into the
 * reporting currency, oldest first. A skipped or pending row never left
 * the account.
 */
export function depositsFor(
  transactions: Transaction[],
  selector: ValueSelector,
  ctx: MoneyContext
): Deposit[] {
  return transactions
    .filter((t) => isAccountDomain(t.domain) && t.status === "PAID" && matchesSelector(t, selector))
    .map((t) => ({ amount: convertedAmount(t, ctx), at: occurred(t) }))
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** Everything paid in up to `asOf`, in the reporting currency. */
export function costBasisAt(
  transactions: Transaction[],
  selector: ValueSelector,
  asOf: Date,
  ctx: MoneyContext
): number {
  return depositsFor(transactions, selector, ctx)
    .filter((d) => d.at <= asOf)
    .reduce((sum, d) => sum + d.amount, 0);
}

/** The selector's value checks converted into the reporting currency. */
export function valueChecks(
  valuations: InvestmentValuation[],
  selector: ValueSelector,
  ctx: MoneyContext
): ValuePoint[] {
  return valuations
    .filter((v) => matchesSelector(v, selector))
    .map((v) => ({
      value: convert(v.value, v.currency, ctx.target, ctx.rates),
      asOf: v.asOf.toDate(),
    }));
}

/** The most recent valuation at or before `asOf`, or null. */
export function latestValuationAt(
  valuations: InvestmentValuation[],
  asOf: Date
): InvestmentValuation | null {
  let best: InvestmentValuation | null = null;
  for (const v of valuations) {
    const at = v.asOf.toDate();
    if (at <= asOf && (!best || at > best.asOf.toDate())) best = v;
  }
  return best;
}

/**
 * What the position is worth at `asOf` in the reporting currency: the
 * latest recorded check carried forward (with interest, when the account
 * quotes a rate) plus what went in since — see `interest.valueAt`.
 */
export function currentValue(
  transactions: Transaction[],
  valuations: InvestmentValuation[],
  selector: ValueSelector,
  rate: InterestRate | undefined,
  asOf: Date,
  ctx: MoneyContext
): number {
  return valueAt(
    depositsFor(transactions, selector, ctx),
    valueChecks(valuations, selector, ctx),
    rate,
    asOf
  );
}

/**
 * Invested vs value, one point per month for the last `months` months, for
 * FlowChart (`income` = invested, `expense` = value — the caller relabels).
 * Before any valuation exists value is the interest estimate — or simply the
 * basis without a rate — so the two lines start together and split where
 * the user first told us what the position was really worth.
 */
export function valuationSeries(
  transactions: Transaction[],
  valuations: InvestmentValuation[],
  selector: ValueSelector,
  ctx: MoneyContext,
  months: number,
  now: Date = new Date(),
  rate?: InterestRate
): FlowPoint[] {
  const deposits = depositsFor(transactions, selector, ctx);
  const checks = valueChecks(valuations, selector, ctx);
  const points: FlowPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = i === 0 ? now : new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59);
    const invested = deposits.filter((d) => d.at <= monthEnd).reduce((s, d) => s + d.amount, 0);
    const value = valueAt(deposits, checks, rate, monthEnd);
    points.push({ label: formatDate(monthStart, "month"), income: invested, expense: value });
  }
  return points;
}
