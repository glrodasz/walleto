import type { MoneyContext } from "../../../helpers/aggregations";
import {
  borrowedAt,
  costBasisAt,
  currentValue,
  gainFromValue,
  latestValuationAt,
  matchesSelector,
  positionSign,
  selectorKey,
} from "./valuation";
import type { ValueSelector } from "./valuation";
import type {
  Account,
  AccountDomain,
  Currency,
  InterestRate,
  InvestmentValuation,
  Language,
  Transaction,
} from "../../../types";
import { translate } from "../../../helpers/i18n";
import { INVESTMENT_MESSAGES } from "../messages";

export interface AccountValueRow {
  key: string;
  selector: ValueSelector;
  name: string;
  /** The bank or broker, when the account names one. */
  sub?: string;
  rate?: InterestRate;
  /** The account's own currency; the bucket row has none. */
  currency?: Currency;
  invested: number;
  value: number;
  latest: InvestmentValuation | null;
  gainPct: number | null;
  /**
   * Whether `value` is a real figure. Always true for an asset; a debt needs
   * a balance check or a recorded borrowing first.
   */
  known: boolean;
  /** Debts: what the ledger records as borrowed (positive); 0 otherwise. */
  borrowed: number;
}

/**
 * One row per account / pocket of the domain — what went in, what it is worth,
 * the gain — plus one bucket row for whatever is filed under none (including
 * valuations from before accounts existed), largest value first. The bucket
 * only appears once it holds something.
 *
 * `transactions` must reach back to inception: a cost basis is the whole
 * history of the position, not the page's month. `valuations` must already
 * carry their domain (`withDomain`).
 *
 * For debts `invested` is what has been repaid net of what was borrowed
 * and `value` what is still owed (0 until a balance or a borrowing is
 * recorded — `known` says which); a gain % means nothing there, and
 * the bucket is "Unassigned" rather than "No debt", which would read as
 * debt-free.
 */
export function domainValueRows(
  accounts: Account[],
  transactions: Transaction[],
  valuations: InvestmentValuation[],
  domain: AccountDomain,
  ctx: MoneyContext,
  now: Date,
  /** Names the bucket row ("No account" / "Sin cuenta"). */
  language: Language = "en"
): AccountValueRow[] {
  const sign = positionSign(domain);
  const build = (
    selector: ValueSelector,
    name: string,
    sub: string | undefined,
    rate: InterestRate | undefined,
    currency?: Currency
  ): AccountValueRow => {
    const invested = costBasisAt(transactions, selector, now, ctx);
    const value = currentValue(transactions, valuations, selector, rate, now, ctx, sign);
    const latest = latestValuationAt(
      valuations.filter((v) => matchesSelector(v, selector)),
      now
    );
    const borrowed = sign < 0 ? borrowedAt(transactions, selector, now, ctx) : 0;
    return {
      key: selectorKey(selector),
      selector,
      name,
      sub,
      rate,
      currency,
      invested,
      value,
      latest,
      gainPct: sign < 0 ? null : gainFromValue(invested, value),
      known: sign > 0 || latest !== null || borrowed > 0,
      borrowed,
    };
  };

  const byAccount = accounts
    .filter((a) => a.id)
    .map((a) => build({ accountId: a.id! }, a.name, a.provider, a.interestRate, a.currency));

  const bucketName = translate(
    INVESTMENT_MESSAGES,
    language,
    sign < 0 ? "bucket.unassigned" : `bucket.${domain}`
  );
  const bucket = build({ domain }, bucketName, undefined, undefined);
  // Net of withdrawals, so "anything at all" rather than "more than nothing".
  const unassigned = bucket.invested !== 0 || bucket.latest ? [bucket] : [];

  return [...byAccount, ...unassigned].sort((a, b) => b.value - a.value);
}

/** The domain as a whole: what went in, what it is worth, when it was last checked. */
export function domainValueTotals(rows: AccountValueRow[]): {
  invested: number;
  value: number;
  lastCheckedAt: Date | null;
  /** Some row has a real figure (for a debt: a check or a recorded borrowing). */
  known: boolean;
} {
  let lastCheckedAt: Date | null = null;
  for (const r of rows) {
    const at = r.latest?.asOf.toDate() ?? null;
    if (at && (!lastCheckedAt || at > lastCheckedAt)) lastCheckedAt = at;
  }
  return {
    invested: rows.reduce((sum, r) => sum + r.invested, 0),
    value: rows.reduce((sum, r) => sum + r.value, 0),
    lastCheckedAt,
    known: rows.some((r) => r.known),
  };
}
