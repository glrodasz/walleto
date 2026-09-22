import { useMemo } from "react";
import { usePrivacy } from "./usePrivacy";
import { usePreferences } from "./usePreferences";
import {
  formatAmount as format,
  formatCompact as compact,
  formatNative as native,
  formatNumber as number,
  formatPercent as percent,
} from "../helpers/money";
import type { FormatOptions } from "../helpers/money";
import type { Currency } from "../types";

/**
 * The money formatters bound to privacy mode and to the user's number
 * preferences (decimal separator, decimals shown). Every amount the UI
 * writes out goes through this hook, so one toggle masks all of them and one
 * setting reshapes all of them; the pure functions in `helpers/money` stay
 * for tests and for anything outside React.
 *
 * Only the text changes. Bar heights, shares and sort order keep using the
 * real values, so a masked chart still has the shape of the month.
 */
export function useMoneyFormat() {
  const { hidden } = usePrivacy();
  const { decimalSeparator: separator, decimals } = usePreferences();

  return useMemo(
    () => ({
      hidden,
      separator,
      decimals,
      formatAmount: (
        value: number,
        currency: Currency,
        options?: Omit<FormatOptions, "hidden" | "separator" | "decimals">
      ) => format(value, currency, { ...options, hidden, separator, decimals }),
      formatCompact: (value: number, currency: Currency) =>
        compact(value, currency, { hidden, separator }),
      formatNative: (value: number, currency: Currency, displayCurrency: Currency) =>
        native(value, currency, displayCurrency, { hidden, separator, decimals }),
      /** A rate or a ratio: never masked, since it is a proportion rather than money. */
      formatNumber: (value: number, maxDecimals = 2, minDecimals = 0) =>
        number(value, { minDecimals, maxDecimals, separator }),
      formatPercent: (value: number, digits = 1) => percent(value, digits, separator),
      /**
       * Axis ticks: blank while hidden. A column of four identical `$****`
       * labels reads as a rendering bug, and the gridlines already carry the
       * scale the bars are drawn against.
       */
      formatTick: (value: number, currency: Currency) =>
        hidden ? "" : compact(value, currency, { separator }),
    }),
    [hidden, separator, decimals]
  );
}
