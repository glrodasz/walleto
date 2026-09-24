import { formatDate } from "../../../helpers/dates";
import { convertedAmount } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { convert } from "../../../helpers/fx";
import { isAccountDomain } from "../../../helpers/accounts";
import { rootIdMap, rootIdOf } from "../../../helpers/categoryTree";
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

/**
 * +1 for what you own, −1 for what you owe. A debt is a negative position:
 * its balance checks are fed into the interest and gain maths as `−value`, so
 * the balance compounds up, each repayment compounds down, and the gain
 * chain reports interest as a loss — the same code, one sign.
 */
export function positionSign(domain: AccountDomain): 1 | -1 {
  return domain === "DEBT" ? -1 : 1;
}

/**
 * Where "the whole history" starts. A cost basis, a value and the gain chain
 * all need every contribution ever made, not a page's window — and every
 * query that reaches back must use this same instant, so the Firestore SDK
 * folds them onto one listen target.
 */
export const INCEPTION = new Date(2000, 0, 1);

/**
 * Oldest first; two checks on the same day settle by creation, then id, so
 * "the latest check" means one thing everywhere — the gain chain and the
 * Value view must end on the same one.
 */
export function byAsOfAsc(a: InvestmentValuation, b: InvestmentValuation): number {
  const at = a.asOf.toDate().getTime() - b.asOf.toDate().getTime();
  if (at !== 0) return at;
  const created = (a.createdAt?.toDate().getTime() ?? 0) - (b.createdAt?.toDate().getTime() ?? 0);
  if (created !== 0) return created;
  return (a.id ?? "").localeCompare(b.id ?? "");
}

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
  return viaCategory === "SAVING" || viaCategory === "DEBT" ? viaCategory : "INVESTMENT";
}

/**
 * The selector a valuation hangs from: its account, or its domain's "No
 * account" bucket. Resolves the domain through `categories` for the rows
 * written before accounts existed.
 */
export function valuationSelector(
  v: Pick<InvestmentValuation, "accountId" | "domain" | "categoryId">,
  categories: Pick<Category, "id" | "domain">[] = []
): ValueSelector {
  return v.accountId ? { accountId: v.accountId } : { domain: valuationDomain(v, categories) };
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
 * reporting currency and signed (a withdrawal is a negative deposit; on a
 * debt, money borrowed), oldest first. A skipped or pending row never left
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

/**
 * The selector's value checks converted into the reporting currency, signed
 * for the maths: a debt's balance owed becomes a negative value.
 */
export function valueChecks(
  valuations: InvestmentValuation[],
  selector: ValueSelector,
  ctx: MoneyContext,
  sign: 1 | -1 = 1
): ValuePoint[] {
  return valuations
    .filter((v) => matchesSelector(v, selector))
    .sort(byAsOfAsc)
    .map((v) => ({
      value: sign * convert(v.value, v.currency, ctx.target, ctx.rates),
      asOf: v.asOf.toDate(),
    }));
}

/**
 * The root category most of this position's money came in through, or null
 * when nothing has. Only a suggestion: it prefills the value form's category
 * so the common case — one category per account — costs no thought, and the
 * owner overrides it when a different holding is what moved.
 */
export function dominantCategoryId(
  transactions: Transaction[],
  selector: ValueSelector,
  categories: Category[],
  ctx: MoneyContext
): string | null {
  const roots = rootIdMap(categories);
  const byCategory = new Map<string, number>();
  for (const t of transactions) {
    // Only money that came in says which holding it went to.
    if (
      !isAccountDomain(t.domain) ||
      t.status !== "PAID" ||
      t.direction === "OUT" ||
      !matchesSelector(t, selector)
    )
      continue;
    const key = rootIdOf(t.categoryId, roots);
    byCategory.set(key, (byCategory.get(key) ?? 0) + convertedAmount(t, ctx));
  }
  let best: string | null = null;
  for (const [key, total] of byCategory) {
    if (best === null || total > byCategory.get(best)!) best = key;
  }
  return best;
}

/** The most recent valuation at or before `asOf`, or null. */
export function latestValuationAt(
  valuations: InvestmentValuation[],
  asOf: Date
): InvestmentValuation | null {
  let best: InvestmentValuation | null = null;
  for (const v of [...valuations].sort(byAsOfAsc)) {
    if (v.asOf.toDate() <= asOf) best = v;
  }
  return best;
}

/**
 * What the position is worth at `asOf` in the reporting currency: the
 * latest recorded check carried forward (with interest, when the account
 * quotes a rate) plus what went in since — see `interest.valueAt`. For a
 * debt (`sign` −1) the figure is what is owed, and it is 0 until a balance
 * has been recorded: repayments alone say nothing about the balance, so the
 * interest estimate that serves an asset would be meaningless here.
 */
export function currentValue(
  transactions: Transaction[],
  valuations: InvestmentValuation[],
  selector: ValueSelector,
  rate: InterestRate | undefined,
  asOf: Date,
  ctx: MoneyContext,
  sign: 1 | -1 = 1
): number {
  const checks = valueChecks(valuations, selector, ctx, sign);
  if (sign < 0 && !checks.some((c) => c.asOf <= asOf)) return 0;
  return sign * valueAt(depositsFor(transactions, selector, ctx), checks, rate, asOf);
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
  rate?: InterestRate,
  sign: 1 | -1 = 1
): FlowPoint[] {
  const deposits = depositsFor(transactions, selector, ctx);
  const checks = valueChecks(valuations, selector, ctx, sign);
  const points: FlowPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = i === 0 ? now : new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59);
    const invested = deposits.filter((d) => d.at <= monthEnd).reduce((s, d) => s + d.amount, 0);
    // A debt has no balance before its first check — see `currentValue`.
    const known = sign > 0 || checks.some((c) => c.asOf <= monthEnd);
    const value = known ? sign * valueAt(deposits, checks, rate, monthEnd) : 0;
    points.push({ label: formatDate(monthStart, "month"), income: invested, expense: value });
  }
  return points;
}
