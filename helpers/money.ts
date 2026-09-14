import { ZERO_DECIMAL_CURRENCIES } from "../constants";
import type { Currency } from "../types";

/**
 * One locale for the whole UI on purpose. Formatting each currency in its own
 * locale put "$ 26.900" (es-CO) next to "$1,150.00" (en-US) in the same list,
 * where the COP row reads as twenty-six dollars.
 */
const GROUPING_LOCALE = "en-US";

/** What an amount reads as while privacy mode is on. */
export const MONEY_MASK = "****";

export interface FormatOptions {
  /** Write the ISO code instead of the symbol — "COP 220,000" rather than "$220,000". */
  code?: boolean;
  /** Privacy mode: keep the currency's chrome, swap the number for the mask. */
  hidden?: boolean;
}

/** Parts that carry the value itself — everything the mask has to swallow. */
const NUMERIC_PARTS = new Set([
  "integer",
  "group",
  "decimal",
  "fraction",
  "minusSign",
  "plusSign",
  "nan",
  "infinity",
  // The compact suffix ("K", "M") is the order of magnitude, so it goes too.
  "compact",
]);

/**
 * "$1,150.00" → "$****", "SEK 449.00" → "SEK ****". Built on `formatToParts`
 * rather than a regex over the output so the symbol keeps the side the locale
 * put it on and the spacing around it survives.
 */
function mask(parts: Intl.NumberFormatPart[]): string {
  let out = "";
  let written = false;
  for (const part of parts) {
    if (!NUMERIC_PARTS.has(part.type)) {
      out += part.value;
      continue;
    }
    if (!written) {
      out += MONEY_MASK;
      written = true;
    }
  }
  return out;
}

export function formatAmount(
  value: number,
  currency: Currency,
  { code = false, hidden = false }: FormatOptions = {}
): string {
  const digits = ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
  const formatter = new Intl.NumberFormat(GROUPING_LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: code ? "code" : "symbol",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return hidden ? mask(formatter.formatToParts(value)) : formatter.format(value);
}

/**
 * Axis ticks: "SEK 60K", "$60K", "COP 4M". Symbol when it is unambiguous
 * (the reporting currency's own), ISO code otherwise.
 */
export function formatCompact(
  value: number,
  currency: Currency,
  { hidden = false }: Pick<FormatOptions, "hidden"> = {}
): string {
  const formatter = new Intl.NumberFormat(GROUPING_LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: currency === "USD" ? "symbol" : "code",
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  return hidden ? mask(formatter.formatToParts(value)) : formatter.format(value);
}

/**
 * How a row's own amount should read next to totals in `displayCurrency`:
 * symbol when they match, ISO code when they don't — $, MXN$ and COP$ are all
 * "$" otherwise.
 */
export function formatNative(
  value: number,
  currency: Currency,
  displayCurrency: Currency,
  { hidden = false }: Pick<FormatOptions, "hidden"> = {}
): string {
  return formatAmount(value, currency, { code: currency !== displayCurrency, hidden });
}
