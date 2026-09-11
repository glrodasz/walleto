import type { Currency } from "../../types";
import { ZERO_DECIMAL_CURRENCIES } from "../../constants";

interface Props {
  value: number;
  currency: Currency;
  size?: "sm" | "md" | "lg";
  /** Sign-based coloring: green for >= 0, red for negative. For net-flow figures. */
  colorize?: boolean;
  /** Append the ISO code — pass when the value's currency differs from the
   *  reporting currency; USD/MXN/COP all render "$" and are otherwise
   *  indistinguishable. */
  showCode?: boolean;
  /** Prefix "≈" to mark a converted (approximate) aggregate. */
  approximate?: boolean;
}

const SIZE_MAP = {
  sm: "0.85rem",
  md: "1.1rem",
  lg: "1.9rem",
};

/**
 * One locale for the whole UI on purpose. Formatting each currency in its own
 * locale put "$ 26.900" (es-CO) next to "$1,150.00" (en-US) in the same list,
 * where the COP row reads as twenty-six dollars.
 */
const GROUPING_LOCALE = "en-US";

interface FormatOptions {
  /** Write the ISO code instead of the symbol — "COP 220,000" rather than "$220,000". */
  code?: boolean;
}

export function formatAmount(
  value: number,
  currency: Currency,
  { code = false }: FormatOptions = {}
): string {
  const digits = ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
  return new Intl.NumberFormat(GROUPING_LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: code ? "code" : "symbol",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/**
 * Axis ticks: "SEK 60K", "$60K", "COP 4M". Symbol when it is unambiguous
 * (the reporting currency's own), ISO code otherwise.
 */
export function formatCompact(value: number, currency: Currency): string {
  return new Intl.NumberFormat(GROUPING_LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: currency === "USD" ? "symbol" : "code",
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * How a row's own amount should read next to totals in `displayCurrency`:
 * symbol when they match, ISO code when they don't — $, MXN$ and COP$ are all
 * "$" otherwise.
 */
export function formatNative(value: number, currency: Currency, displayCurrency: Currency): string {
  return formatAmount(value, currency, { code: currency !== displayCurrency });
}

export function Amount({
  value,
  currency,
  size = "md",
  colorize = false,
  showCode = false,
  approximate = false,
}: Props) {
  const color = colorize ? (value >= 0 ? "var(--accent)" : "var(--accent-hot)") : "var(--fg-0)";

  return (
    <span className="amount">
      {approximate && <span className="approx">≈ </span>}
      {formatAmount(value, currency)}
      {showCode && <span className="code"> {currency}</span>}
      <style jsx>{`
        .amount {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: ${SIZE_MAP[size]};
          font-weight: 700;
          letter-spacing: -0.03em;
          color: ${color};
        }

        .approx {
          color: var(--fg-2);
          font-weight: 400;
        }

        .code {
          font-size: 0.6em;
          font-weight: 600;
          color: var(--fg-2);
          letter-spacing: 0.04em;
        }
      `}</style>
    </span>
  );
}
