/**
 * Typed numbers, the way people type them. A phone keyboard shows whatever
 * decimal key its locale has — often a comma — so every field accepts both
 * separators and one parser decides what they meant. Generic on purpose:
 * nothing here knows about money or the app.
 */

export type DecimalSeparator = "." | ",";
/** How many fraction digits the UI prints; the stored value keeps its full precision. */
export type Decimals = 0 | 1 | 2 | 3 | 4;

export const DECIMAL_SEPARATORS: DecimalSeparator[] = [".", ","];
export const DECIMALS_OPTIONS: Decimals[] = [0, 1, 2, 3, 4];
export const DEFAULT_DECIMAL_SEPARATOR: DecimalSeparator = ".";
export const DEFAULT_DECIMALS: Decimals = 2;

/** Keeps digits, both separators and — when allowed — one leading minus. */
export function sanitizeDecimal(raw: string, { negative = false } = {}): string {
  const sign = negative && raw.trimStart().startsWith("-") ? "-" : "";
  return sign + raw.replace(/[^\d.,]/g, "");
}

const count = (s: string, ch: string) => s.split(ch).length - 1;

/**
 * "1,5", "1.5", "1.234,56", "1,234.56" → the number they mean. With both
 * separators present the last one is the decimal point; one kind appearing
 * more than once is grouping; one kind appearing once is the decimal point
 * unless it is not the user's separator *and* exactly three digits follow —
 * "1.000" to someone who writes "1,5" is a thousand. Null when no digit
 * survives, so a blank or a lone separator never becomes 0.
 */
export function parseDecimal(
  raw: string,
  separator: DecimalSeparator = DEFAULT_DECIMAL_SEPARATOR
): number | null {
  const trimmed = raw.trim();
  const negative = trimmed.startsWith("-");
  const body = trimmed.replace(/^-/, "").replace(/[^\d.,]/g, "");
  if (!/\d/.test(body)) return null;

  const dots = count(body, ".");
  const commas = count(body, ",");
  let normalized: string;
  if (dots > 0 && commas > 0) {
    const decimal = body.lastIndexOf(".") > body.lastIndexOf(",") ? "." : ",";
    const grouped = body.replace(decimal === "." ? /,/g : /\./g, "");
    const at = grouped.lastIndexOf(decimal);
    normalized = grouped.slice(0, at).replace(/[.,]/g, "") + "." + grouped.slice(at + 1);
  } else if (dots + commas === 0) {
    normalized = body;
  } else {
    const ch = dots > 0 ? "." : ",";
    if (dots + commas > 1) {
      normalized = body.replace(ch === "." ? /\./g : /,/g, "");
    } else {
      const at = body.indexOf(ch);
      const after = body.slice(at + 1);
      const isDecimal = ch === separator || after.length !== 3;
      normalized = isDecimal ? `${body.slice(0, at)}.${after}` : body.slice(0, at) + after;
    }
  }

  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/** A stored number written the way the user types it, for seeding a field. */
export function toInputString(
  n: number,
  separator: DecimalSeparator = DEFAULT_DECIMAL_SEPARATOR
): string {
  return String(n).replace(".", separator);
}

/**
 * Half-up rounding that agrees with what Intl prints: `(1.005).toFixed(2)`
 * is "1.00", while a formatter shows 1.01. Symmetric for negatives.
 */
export function roundTo(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  const rounded = Math.round((Math.abs(n) + Number.EPSILON) * factor) / factor;
  return n < 0 ? -rounded : rounded;
}
