import { useMoneyFormat } from "../../hooks/useMoneyFormat";
import type { Currency } from "../../types";

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
 * Every amount the UI writes out. The number itself is formatted by
 * `helpers/money` through `useMoneyFormat`, so privacy mode masks this atom
 * and every string built with the same formatters at once.
 */
export function Amount({
  value,
  currency,
  size = "md",
  colorize = false,
  showCode = false,
  approximate = false,
}: Props) {
  const { formatAmount } = useMoneyFormat();
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
