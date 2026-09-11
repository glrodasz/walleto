import type { InterestRate } from "../../../types";

/** A PAID contribution, already in the reporting currency. */
export interface Deposit {
  amount: number;
  at: Date;
}

/** A recorded value check, already in the reporting currency. */
export interface ValuePoint {
  value: number;
  asOf: Date;
}

/** Mean Gregorian month, so "months between" is a smooth fraction. */
const MS_PER_MONTH = 30.436875 * 24 * 60 * 60 * 1000;

/**
 * The per-month rate behind a quoted one. A yearly quote is the effective
 * annual rate, so it is de-compounded rather than divided by twelve.
 */
export function monthlyRate(rate?: InterestRate | null): number {
  if (!rate || !(rate.value > 0)) return 0;
  const r = rate.value / 100;
  return rate.period === "YEARLY" ? Math.pow(1 + r, 1 / 12) - 1 : r;
}

export function monthsBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / MS_PER_MONTH);
}

/** `amount` left to compound monthly at `r` from `from` to `to`. */
export function grow(amount: number, r: number, from: Date, to: Date): number {
  if (r === 0) return amount;
  return amount * Math.pow(1 + r, monthsBetween(from, to));
}

/** Every deposit made by `asOf`, each compounded from its own date. */
export function estimateWithInterest(deposits: Deposit[], r: number, asOf: Date): number {
  return deposits
    .filter((d) => d.at <= asOf)
    .reduce((sum, d) => sum + grow(d.amount, r, d.at, asOf), 0);
}

/**
 * What the position is worth at `asOf`: the latest value check on or before
 * that date carried forward with interest plus everything deposited since,
 * or — with no check yet — the interest estimate over all deposits. With no
 * rate this degrades to "latest check + later deposits", or plain cost basis.
 */
export function valueAt(
  deposits: Deposit[],
  checks: ValuePoint[],
  rate: InterestRate | undefined,
  asOf: Date
): number {
  const r = monthlyRate(rate);
  let latest: ValuePoint | null = null;
  for (const c of checks) {
    if (c.asOf <= asOf && (!latest || c.asOf > latest.asOf)) latest = c;
  }
  if (!latest) return estimateWithInterest(deposits, r, asOf);
  const anchor = latest;
  const since = deposits.filter((d) => d.at > anchor.asOf);
  return grow(anchor.value, r, anchor.asOf, asOf) + estimateWithInterest(since, r, asOf);
}
