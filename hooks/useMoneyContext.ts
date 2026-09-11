import { useMemo } from "react";
import { useUserDoc } from "./useUserDoc";
import { useExchangeRates } from "./useExchangeRates";
import { IDENTITY_RATES } from "../helpers/fx";
import type { MoneyContext } from "../helpers/aggregations";
import type { Currency } from "../types";

/**
 * The one place that decides how money is reported: which currency everything
 * converts into (displayCurrency ?? mainCurrency) and with which rates.
 *
 * When rates have never been available, `fxMissing` is true and the context
 * falls back to identity rates — consumers should surface that state rather
 * than presenting the un-converted sum as trustworthy.
 */
export function useMoneyContext() {
  const { userDoc, update } = useUserDoc();
  const { rates, stale, loading, error } = useExchangeRates();

  const target: Currency = userDoc?.displayCurrency ?? userDoc?.mainCurrency ?? "USD";

  const ctx: MoneyContext = useMemo(
    () => ({ rates: rates ?? IDENTITY_RATES, target }),
    [rates, target]
  );

  const setDisplayCurrency = async (currency: Currency) => {
    await update({ displayCurrency: currency });
  };

  return {
    ctx,
    target,
    fxStale: stale,
    fxMissing: !rates,
    fxLoading: loading,
    fxError: error,
    setDisplayCurrency,
  };
}
