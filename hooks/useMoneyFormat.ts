import { useMemo } from "react";
import { usePrivacy } from "./usePrivacy";
import {
  formatAmount as format,
  formatCompact as compact,
  formatNative as native,
} from "../helpers/money";
import type { FormatOptions } from "../helpers/money";
import type { Currency } from "../types";

/**
 * The money formatters bound to privacy mode. Every amount the UI writes out
 * goes through this hook, so one toggle masks all of them; the pure functions
 * in `helpers/money` stay for tests and for anything outside React.
 *
 * Only the text changes. Bar heights, shares and sort order keep using the
 * real values, so a masked chart still has the shape of the month.
 */
export function useMoneyFormat() {
  const { hidden } = usePrivacy();

  return useMemo(
    () => ({
      hidden,
      formatAmount: (value: number, currency: Currency, options?: Omit<FormatOptions, "hidden">) =>
        format(value, currency, { ...options, hidden }),
      formatCompact: (value: number, currency: Currency) => compact(value, currency, { hidden }),
      formatNative: (value: number, currency: Currency, displayCurrency: Currency) =>
        native(value, currency, displayCurrency, { hidden }),
      /**
       * Axis ticks: blank while hidden. A column of four identical `$****`
       * labels reads as a rendering bug, and the gridlines already carry the
       * scale the bars are drawn against.
       */
      formatTick: (value: number, currency: Currency) => (hidden ? "" : compact(value, currency)),
    }),
    [hidden]
  );
}
