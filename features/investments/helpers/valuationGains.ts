import { convert } from "../../../helpers/fx";
import type { MoneyContext } from "../../../helpers/aggregations";
import { monthKey } from "../../../helpers/dates";
import { rootIdMap, rootIdOf } from "../../../helpers/categoryTree";
import { byAsOfAsc, depositsFor, selectorKey, valuationSelector, withDomain } from "./valuation";
import type { ValueSelector } from "./valuation";
import type {
  AccountDomain,
  Category,
  Currency,
  InvestmentValuation,
  Transaction,
} from "../../../types";
import type { Deposit } from "./interest";

/**
 * What one value check added in the month it lands in: the gain it reports
 * since the previous check of the same account / bucket.
 */
export interface GainRow {
  id?: string;
  /** `acc:<id>` or `dom:<DOMAIN>` — the chain this check belongs to. */
  selector: string;
  at: Date;
  /** Converted into the reporting currency; negative when the position lost ground. */
  gain: number;
  /** The check's own currency, so the caller can flag "≈". */
  currency: Currency;
  /**
   * The root category the owner filed this gain under, or null when they
   * never did — checks recorded before the form asked. An unfiled gain still
   * counts toward the month; it just has no row of its own to sit in.
   */
  categoryId: string | null;
}

/**
 * Every value check of `domain`, oldest first, each carrying the gain it
 * reported since the previous check of the same account / bucket.
 *
 * A check is measured against what the position should have been worth had
 * nothing moved: the previous check's value plus every deposit since it — or,
 * for the first check, everything paid in up to that day. Every term is
 * converted into the reporting currency at today's rate, the same way the
 * Value view converts, so the chain telescopes into an identity that holds on
 * any day and in any display currency:
 *
 *     contributions + Σ gains = last check's value + deposits since it
 *
 * — which is exactly what the Value view shows for an account without an
 * interest rate. The `costBasis` the check snapshotted is deliberately not
 * used here: it froze one day's exchange rate, and the day the rate moved
 * the category read 98 SEK short of the account it summed. That snapshot
 * still serves the history list and the check's own gain %.
 *
 * A deposit dated at a check's `asOf` belongs to that check, as in
 * `interest.valueAt`. Two checks on one day see no deposits between them, so
 * the later one reports the value difference alone. Rows written before
 * accounts existed carry no `domain`; `withDomain` resolves theirs through
 * their category first, so they chain in the right place.
 */
export function valuationGainRows(
  valuations: InvestmentValuation[],
  transactions: Transaction[],
  domain: AccountDomain,
  categories: Category[],
  ctx: MoneyContext
): GainRow[] {
  const mine = withDomain(valuations, categories)
    .filter((v) => v.domain === domain)
    .sort(byAsOfAsc);
  const roots = rootIdMap(categories);

  // Deposits per chain, built once each; the previous check's value and date
  // so the next one knows what "since" means.
  const deposits = new Map<string, Deposit[]>();
  const previous = new Map<string, { value: number; asOf: Date }>();
  const depositsOf = (key: string, selector: ValueSelector): Deposit[] => {
    let list = deposits.get(key);
    if (!list) {
      list = depositsFor(transactions, selector, ctx);
      deposits.set(key, list);
    }
    return list;
  };

  return mine.map((v) => {
    const selector = valuationSelector(v, categories);
    const key = selectorKey(selector);
    const at = v.asOf.toDate();
    const prev = previous.get(key) ?? null;
    const since = depositsOf(key, selector)
      .filter((d) => (prev ? d.at > prev.asOf : true) && d.at <= at)
      .reduce((sum, d) => sum + d.amount, 0);
    const value = convert(v.value, v.currency, ctx.target, ctx.rates);
    const gain = value - ((prev?.value ?? 0) + since);
    previous.set(key, { value, asOf: at });
    return {
      id: v.id,
      selector: key,
      at,
      gain,
      currency: v.currency,
      categoryId: v.categoryId ? rootIdOf(v.categoryId, roots) : null,
    };
  });
}

/**
 * The gains that name a category, dressed as ledger rows so the category
 * stacks, the breakdown and the month list fold them in through the paths
 * they already have — one ranking, one "Other" cap, one set of shares. The
 * amount is already converted, so it carries the reporting currency; the row
 * is marked synthetic so it never counts as a transaction.
 */
export function gainRowsAsTransactions(rows: GainRow[], ctx: MoneyContext): Transaction[] {
  return rows
    .filter((r) => r.categoryId)
    .map(
      (r) =>
        ({
          id: `gain:${r.id ?? r.selector}`,
          userId: "",
          domain: "INVESTMENT",
          categoryId: r.categoryId!,
          name: "Gain",
          amount: r.gain,
          currency: ctx.target,
          occurredAt: {
            seconds: Math.floor(r.at.getTime() / 1000),
            nanoseconds: 0,
            toDate: () => r.at,
          },
          status: "PAID",
          synthetic: true,
        }) as unknown as Transaction
    );
}

/**
 * The gains of one month, summed per root category. Rows nobody filed are
 * left out — `unfiledGain` reports those, since no category can hold them.
 */
export function gainsByCategory(rows: GainRow[], windowKey: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    if (!r.categoryId || monthKey(r.at) !== windowKey) continue;
    out[r.categoryId] = (out[r.categoryId] ?? 0) + r.gain;
  }
  return out;
}

/** What a month's unfiled gains add up to — the part no category can hold. */
export function unfiledGain(rows: GainRow[], windowKey: string): number {
  return rows
    .filter((r) => !r.categoryId && monthKey(r.at) === windowKey)
    .reduce((sum, r) => sum + r.gain, 0);
}

/**
 * The gain each month window earned, keyed like `monthTotals`: every window
 * key present, 0 where no check landed. Checks outside the windows still
 * anchor their chain — they simply add to no bar.
 */
export function monthGains(
  valuations: InvestmentValuation[],
  transactions: Transaction[],
  domain: AccountDomain,
  categories: Category[],
  ctx: MoneyContext,
  windows: { key: string }[]
): Record<string, number> {
  const gains: Record<string, number> = {};
  for (const w of windows) gains[w.key] = 0;
  for (const row of valuationGainRows(valuations, transactions, domain, categories, ctx)) {
    const key = monthKey(row.at);
    if (key in gains) gains[key] += row.gain;
  }
  return gains;
}
