import { useMemo } from "react";
import { usePreferences } from "./usePreferences";
import { parseDecimal, sanitizeDecimal, toInputString } from "../utils/decimal";

/**
 * The typed-number helpers bound to the user's decimal separator: what a
 * field keeps while typing, what it means on submit, and how a stored value
 * is written back into it. Parsing accepts either separator regardless — the
 * preference only breaks the "1.000" tie and decides how numbers are echoed.
 * `toPrefill` is what a field opens on: a 0 is left out so the placeholder
 * shows it, instead of sitting in the field for the owner to type behind.
 */
export function useDecimalInput() {
  const { decimalSeparator } = usePreferences();
  return useMemo(
    () => ({
      separator: decimalSeparator,
      sanitize: (raw: string, options?: { negative?: boolean }) => sanitizeDecimal(raw, options),
      parse: (raw: string) => parseDecimal(raw, decimalSeparator),
      toInput: (n: number) => toInputString(n, decimalSeparator),
      toPrefill: (n: number) =>
        n === 0 || !Number.isFinite(n) ? "" : toInputString(n, decimalSeparator),
    }),
    [decimalSeparator]
  );
}
