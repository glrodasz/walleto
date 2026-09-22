import { ZERO_DECIMAL_CURRENCIES } from "../constants";
import { DEFAULT_DECIMAL_SEPARATOR, DEFAULT_DECIMALS } from "../utils/decimal";
import type { DecimalSeparator, Decimals } from "../utils/decimal";
import type { Currency } from "../types";

/**
 * One locale for the whole UI on purpose. Formatting each currency in its own
 * locale put "$ 26.900" (es-CO) next to "$1,150.00" (en-US) in the same list,
 * where the COP row reads as twenty-six dollars. The user's decimal separator
 * is applied on top (`render`), never by switching locale: "de-DE" would move
 * the symbol after the number and "es-CO" even changes it to "US$".
 */
const GROUPING_LOCALE = "en-US";

/** What an amount reads as while privacy mode is on. */
export const MONEY_MASK = "****";

/** How the user wants numbers written: Settings › Preferences. */
export interface NumberFormatPrefs {
  /** "." writes 1,234.56; "," writes 1.234,56. */
  separator?: DecimalSeparator;
  /** Fraction digits to print for currencies that have them. */
  decimals?: Decimals;
}

export interface FormatOptions extends NumberFormatPrefs {
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

/** The formatted parts as text, with the user's separators swapped in. */
function render(
  parts: Intl.NumberFormatPart[],
  separator: DecimalSeparator,
  hidden: boolean
): string {
  if (hidden) return mask(parts);
  if (separator === ".") return parts.map((p) => p.value).join("");
  return parts
    .map((p) => (p.type === "group" ? "." : p.type === "decimal" ? "," : p.value))
    .join("");
}

export function formatAmount(
  value: number,
  currency: Currency,
  {
    code = false,
    hidden = false,
    separator = DEFAULT_DECIMAL_SEPARATOR,
    decimals = DEFAULT_DECIMALS,
  }: FormatOptions = {}
): string {
  const digits = ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : decimals;
  const formatter = new Intl.NumberFormat(GROUPING_LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: code ? "code" : "symbol",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return render(formatter.formatToParts(value), separator, hidden);
}

/**
 * Axis ticks: "SEK 60K", "$60K", "COP 4M". Symbol when it is unambiguous
 * (the reporting currency's own), ISO code otherwise.
 */
export function formatCompact(
  value: number,
  currency: Currency,
  {
    hidden = false,
    separator = DEFAULT_DECIMAL_SEPARATOR,
  }: Pick<FormatOptions, "hidden" | "separator"> = {}
): string {
  const formatter = new Intl.NumberFormat(GROUPING_LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: currency === "USD" ? "symbol" : "code",
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  return render(formatter.formatToParts(value), separator, hidden);
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
  options: Omit<FormatOptions, "code"> = {}
): string {
  return formatAmount(value, currency, { ...options, code: currency !== displayCurrency });
}

export interface PlainNumberOptions extends Pick<NumberFormatPrefs, "separator"> {
  minDecimals?: number;
  maxDecimals?: number;
}

/** A plain number — a rate, a percentage — grouped and separated like the amounts. */
export function formatNumber(
  value: number,
  {
    minDecimals = 0,
    maxDecimals = DEFAULT_DECIMALS,
    separator = DEFAULT_DECIMAL_SEPARATOR,
  }: PlainNumberOptions = {}
): string {
  const formatter = new Intl.NumberFormat(GROUPING_LOCALE, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: Math.max(minDecimals, maxDecimals),
  });
  return render(formatter.formatToParts(value), separator, false);
}

/** "16.7%" — a fixed number of decimals, as a gain figure reads. */
export function formatPercent(
  value: number,
  decimals = 1,
  separator: DecimalSeparator = DEFAULT_DECIMAL_SEPARATOR
): string {
  return `${formatNumber(value, { minDecimals: decimals, maxDecimals: decimals, separator })}%`;
}
