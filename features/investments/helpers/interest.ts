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
const DAYS_PER_MONTH = 30.436875;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * The per-month rate behind a quoted one. A yearly quote is the nominal
 * annual rate a bank prints, charged each month as a twelfth — 2.85% on
 * 606,673 is the 1,441 of interest on the statement, not a de-compounded 1,422.
 */
export function monthlyRate(rate?: InterestRate | null): number {
  if (!rate || !(rate.value > 0)) return 0;
  const r = rate.value / 100;
  return rate.period === "YEARLY" ? r / 12 : r;
}

/**
 * Whether a value check already applies at `asOf`. A check is a reading for
 * its whole day: the form stores it at noon, so comparing instants would
 * hide one recorded this morning until midday.
 */
export function checkedBy(checkAsOf: Date, asOf: Date): boolean {
  return startOfDay(checkAsOf) <= asOf.getTime();
}

/**
 * Elapsed months counted in whole calendar days: interest accrues per day, so
 * a value check reads exactly as entered on its own day and a figure doesn't
 * creep up second by second while the page is open. Rounding the day count
 * absorbs a DST hour.
 */
export function monthsBetween(from: Date, to: Date): number {
  const days = Math.round((startOfDay(to) - startOfDay(from)) / MS_PER_DAY);
  return Math.max(0, days / DAYS_PER_MONTH);
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
  // Checks arrive oldest first (`valueChecks` sorts them), so on a tie the
  // later one in the array is the later-recorded one and wins.
  let latest: ValuePoint | null = null;
  for (const c of checks) {
    if (checkedBy(c.asOf, asOf) && (!latest || c.asOf >= latest.asOf)) latest = c;
  }
  if (!latest) return estimateWithInterest(deposits, r, asOf);
  const anchor = latest;
  const since = deposits.filter((d) => d.at > anchor.asOf);
  return grow(anchor.value, r, anchor.asOf, asOf) + estimateWithInterest(since, r, asOf);
}

const DAY_MS = MS_PER_DAY;

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** `d`'s calendar day `k` months on, clamped to the end of a shorter month. */
function addMonths(d: Date, k: number): Date {
  const y = d.getFullYear();
  const m = d.getMonth() + k;
  const target = new Date(y, m, 1);
  const day = Math.min(d.getDate(), daysInMonth(target.getFullYear(), target.getMonth()));
  return new Date(target.getFullYear(), target.getMonth(), day);
}

/** Whole calendar months from `from` to `to`: Oct 28 → Nov 27 is 0, → Nov 28 is 1. */
export function wholeMonthsBetween(from: Date, to: Date): number {
  const a = new Date(startOfDay(from));
  const b = new Date(startOfDay(to));
  if (b <= a) return 0;
  let k = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (addMonths(a, k) > b) k--;
  return Math.max(0, k);
}

/**
 * Calendar months from `from` to `to`: whole months plus the days left over
 * as a share of the month they fall in. A bank charges one period's interest
 * from one due date to the next, so Oct 28 → Nov 28 is exactly 1 — the mean
 * Gregorian month of `monthsBetween` would read it as 1.018 and overcharge.
 */
export function calendarMonthsBetween(from: Date, to: Date): number {
  const k = wholeMonthsBetween(from, to);
  const base = addMonths(new Date(startOfDay(from)), k);
  const next = addMonths(new Date(startOfDay(from)), k + 1);
  const left = Math.round((startOfDay(to) - base.getTime()) / DAY_MS);
  const span = Math.round((next.getTime() - base.getTime()) / DAY_MS);
  return k + Math.max(0, left) / span;
}

/**
 * What a debt stands at on `asOf`, signed like `valueAt` (owed is negative).
 *
 * A loan isn't a savings balance compounding by the day. The bank's balance
 * is the principal; interest is charged in arrears and settled inside each
 * repayment, so the balance only moves on a payment date, by the payment less
 * that period's interest. So, from the latest balance check:
 *
 * - each repayment first settles the interest since the previous one (calendar
 *   months, so a monthly payment carries exactly a month), then lowers the
 *   balance by what is left — SEB's 2,504 on 606,673 at 2.85% is 1,441 of
 *   interest and 1,063 off, leaving 605,610;
 * - the first repayment after a check carries at least a full month: its
 *   period began at the previous due date, before the check was read;
 * - money borrowed adds to the balance and settles nothing;
 * - between payments the balance holds still, as the bank shows it; only a
 *   whole month gone by with nothing paid adds its interest to what is owed.
 *
 * Before any check this is `valueAt`'s estimate, which the callers never use
 * for a debt (see `valuation.currentValue`).
 */
export function debtValueAt(
  deposits: Deposit[],
  checks: ValuePoint[],
  rate: InterestRate | undefined,
  asOf: Date
): number {
  let latest: ValuePoint | null = null;
  for (const c of checks) {
    if (checkedBy(c.asOf, asOf) && (!latest || c.asOf >= latest.asOf)) latest = c;
  }
  if (!latest) return valueAt(deposits, checks, rate, asOf);
  const anchor = latest;
  const r = monthlyRate(rate);
  let owed = -anchor.value;
  let settled = anchor.asOf;
  let first = true;
  const since = deposits
    .filter((d) => d.at > anchor.asOf && d.at <= asOf)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  for (const d of since) {
    if (d.amount <= 0) {
      owed -= d.amount;
      continue;
    }
    const period = calendarMonthsBetween(settled, d.at);
    const months = first ? Math.max(1, period) : period;
    owed = owed * (1 + r * months) - d.amount;
    settled = d.at;
    first = false;
  }
  owed *= Math.pow(1 + r, wholeMonthsBetween(settled, asOf));
  return -owed;
}

/**
 * What a debt has cost since its first balance check: what is owed at `asOf`
 * minus that first balance, plus every repayment made in between — the part
 * of the balance that repayments did not explain. `checks` are signed the way
 * `debtValueAt` reads a debt (a balance owed is a negative value) and `deposits`
 * are the repayments. Null before any check: with no balance there is no
 * interest to measure.
 */
export function interestAccrued(
  deposits: Deposit[],
  checks: ValuePoint[],
  rate: InterestRate | undefined,
  asOf: Date
): number | null {
  let first: ValuePoint | null = null;
  for (const c of checks) {
    if (checkedBy(c.asOf, asOf) && (!first || c.asOf < first.asOf)) first = c;
  }
  if (!first) return null;
  const anchor = first;
  const owedNow = -debtValueAt(deposits, checks, rate, asOf);
  const repaid = deposits
    .filter((d) => d.at > anchor.asOf && d.at <= asOf)
    .reduce((sum, d) => sum + d.amount, 0);
  return owedNow - -anchor.value + repaid;
}
