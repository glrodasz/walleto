import { convert } from "./fx";
import type { ExchangeRates } from "./fx";
import type { Currency, Domain, RecurrentTransaction, Transaction } from "../types";

/** Every aggregation converts into one reporting currency — never a raw mixed sum. */
export interface MoneyContext {
  rates: ExchangeRates;
  target: Currency;
}

const FREQ_TO_MONTHS: Record<RecurrentTransaction["frequency"], number> = {
  ONE_TIME: 0,
  WEEKLY: 4.345,
  BIWEEKLY: 2,
  MONTHLY: 1,
  QUARTERLY: 1 / 3,
  YEARLY: 1 / 12,
};

export interface MoneyFields {
  amount: number;
  currency: Currency;
  chargedAmount?: number;
  chargedCurrency?: Currency;
}

/**
 * The item's value expressed in the target currency.
 *
 * Charged-pair precedence: when the doc records what was actually debited in
 * the target currency, that ground truth beats any market rate.
 */
export function convertedAmount(item: MoneyFields, ctx: MoneyContext): number {
  if (item.chargedAmount !== undefined && item.chargedCurrency === ctx.target) {
    return item.chargedAmount;
  }
  return convert(item.amount, item.currency, ctx.target, ctx.rates);
}

export function toMonthlyAmount(item: RecurrentTransaction, ctx: MoneyContext): number {
  return convertedAmount(item, ctx) * FREQ_TO_MONTHS[item.frequency];
}

export function sumMonthly(items: RecurrentTransaction[], ctx: MoneyContext): number {
  return items.reduce((acc, i) => acc + toMonthlyAmount(i, ctx), 0);
}

export function groupByCategory(
  items: RecurrentTransaction[],
  ctx: MoneyContext
): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, i) => {
    acc[i.categoryId] = (acc[i.categoryId] ?? 0) + toMonthlyAmount(i, ctx);
    return acc;
  }, {});
}

/** Share of the monthly run-rate held by each currency in use, largest first. */
export function shareByCurrency(
  items: RecurrentTransaction[],
  ctx: MoneyContext
): { currency: Currency; pct: number }[] {
  const byCurrency = new Map<Currency, number>();
  for (const i of items) {
    byCurrency.set(i.currency, (byCurrency.get(i.currency) ?? 0) + toMonthlyAmount(i, ctx));
  }
  const total = Array.from(byCurrency.values()).reduce((a, b) => a + b, 0);
  if (total <= 0) return [];
  return Array.from(byCurrency.entries())
    .filter(([, amount]) => amount > 0)
    .map(([currency, amount]) => ({ currency, pct: (amount / total) * 100 }))
    .sort((a, b) => b.pct - a.pct);
}

/**
 * Monthly money flow across all four domains. `net` follows the owner's
 * definition: what is left unallocated after spending, saving and investing.
 */
export interface MoneyFlow {
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  net: number;
}

export function computeFlow(
  itemsByDomain: Partial<Record<Domain, RecurrentTransaction[]>>,
  ctx: MoneyContext
): MoneyFlow {
  const income = sumMonthly(itemsByDomain.INCOME ?? [], ctx);
  const expenses = sumMonthly(itemsByDomain.EXPENSE ?? [], ctx);
  const savings = sumMonthly(itemsByDomain.SAVING ?? [], ctx);
  const investments = sumMonthly(itemsByDomain.INVESTMENT ?? [], ctx);
  return { income, expenses, savings, investments, net: income - expenses - savings - investments };
}

interface MoMOptions extends MoneyContext {
  /** Restrict to one domain — a mixed array would otherwise pollute the delta. */
  domain?: Domain;
  /** Injectable clock for tests. */
  now?: Date;
}

export function computeMoM(
  transactions: Transaction[],
  opts: MoMOptions
): { current: number; previous: number; deltaPct: number; previousThrough: Date } {
  const now = opts.now ?? new Date();
  const currentFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // Same point last month: the same day-of-month and time, clamped to that
  // month's length (Mar 31 compares against all of February). Comparing
  // month-to-date against a whole month would print "-99%" every 2nd.
  const previousThrough = sameTimeLastMonth(now, previousFrom);

  let current = 0;
  let previous = 0;

  for (const t of transactions) {
    if (opts.domain && t.domain !== opts.domain) continue;

    const d =
      typeof (t.occurredAt as { toDate?: () => Date }).toDate === "function"
        ? (t.occurredAt as { toDate: () => Date }).toDate()
        : new Date(t.occurredAt as unknown as string);

    const value = convertedAmount(t, opts);
    if (d >= currentFrom && d <= now) current += value;
    else if (d >= previousFrom && d <= previousThrough) previous += value;
  }

  const deltaPct = previous === 0 ? 0 : ((current - previous) / previous) * 100;
  return { current, previous, deltaPct, previousThrough };
}

function sameTimeLastMonth(now: Date, previousFrom: Date): Date {
  const daysInPrevious = new Date(
    previousFrom.getFullYear(),
    previousFrom.getMonth() + 1,
    0
  ).getDate();
  return new Date(
    previousFrom.getFullYear(),
    previousFrom.getMonth(),
    Math.min(now.getDate(), daysInPrevious),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  );
}
