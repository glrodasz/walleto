import { CURRENCIES } from "../constants";
import type { Currency } from "../types";

/**
 * Exchange rates quoted against USD: `rates[c]` = units of `c` per 1 USD.
 * USD itself is always pinned to 1.
 */
export interface ExchangeRates {
  base: "USD";
  rates: Record<Currency, number>;
  fetchedAt: string;
}

/** All rates = 1. For tests and for mechanical refactors that must not change output. */
export const IDENTITY_RATES: ExchangeRates = {
  base: "USD",
  rates: Object.fromEntries(CURRENCIES.map((c) => [c, 1])) as Record<Currency, number>,
  fetchedAt: "1970-01-01T00:00:00.000Z",
};

/**
 * Convert via USD cross-rates. Any (from, to) pair works without changing the
 * upstream base: amount → USD → target.
 */
export function convert(amount: number, from: Currency, to: Currency, fx: ExchangeRates): number {
  if (from === to) return amount;
  return (amount * fx.rates[to]) / fx.rates[from];
}

/** Null-safe variant: null when rates are absent or unusable for the pair. */
export function tryConvert(
  amount: number,
  from: Currency,
  to: Currency,
  fx: ExchangeRates | null
): number | null {
  if (from === to) return amount;
  if (!fx) return null;
  const rFrom = fx.rates[from];
  const rTo = fx.rates[to];
  if (typeof rFrom !== "number" || typeof rTo !== "number" || rFrom <= 0 || rTo <= 0) return null;
  return (amount * rTo) / rFrom;
}
