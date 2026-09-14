import { CURRENCIES, CURRENCY_SYMBOL, DEFAULT_ENABLED_CURRENCIES } from "../constants";
import type { Currency } from "../types";

const SUPPORTED = new Set<string>(CURRENCIES);

/**
 * The currencies a picker offers, in catalog order: the user's own choice from
 * Settings, or `DEFAULT_ENABLED_CURRENCIES` when they never made one.
 *
 * `pinned` currencies — the main one, the display one, whatever a record
 * already holds — are folded in whether or not they are enabled, so turning a
 * currency off in Settings never drops a stored value out of its own select.
 */
export function enabledCurrencies(
  chosen: Currency[] | undefined,
  ...pinned: (Currency | undefined | null | "")[]
): Currency[] {
  const base = chosen?.filter((c) => SUPPORTED.has(c)) ?? [];
  const set = new Set<Currency>(base.length ? base : DEFAULT_ENABLED_CURRENCIES);
  for (const p of pinned) if (p && SUPPORTED.has(p)) set.add(p);
  return CURRENCIES.filter((c) => set.has(c));
}

/** `$ USD` options for a `Select`, keeping the order they come in. */
export function currencyOptions(currencies: Currency[]): { value: Currency; label: string }[] {
  return currencies.map((c) => ({ value: c, label: `${CURRENCY_SYMBOL[c]} ${c}` }));
}

/** The list with one currency flipped on or off, back in catalog order. */
export function toggleCurrency(currencies: Currency[], currency: Currency): Currency[] {
  const set = new Set(currencies);
  if (!set.delete(currency)) set.add(currency);
  return CURRENCIES.filter((c) => set.has(c));
}
