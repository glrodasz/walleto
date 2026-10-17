import { useMemo } from "react";
import { useUserDoc } from "./useUserDoc";
import { useExchangeRates } from "./useExchangeRates";
import { IDENTITY_RATES } from "../helpers/fx";
import { DEFAULT_SCENARIO } from "../helpers/variable";
import type { MoneyContext } from "../helpers/aggregations";
import type { Currency, Scenario } from "../types";

/**
 * The one place that decides how money is reported: which currency everything
 * converts into (displayCurrency ?? mainCurrency), with which rates, and which
 * end of a variable expense's band counts (the account's scenario, worst case
 * until the owner picks another).
 *
 * When rates have never been available, `fxMissing` is true and the context
 * falls back to identity rates — consumers should surface that state rather
 * than presenting the un-converted sum as trustworthy.
 */
export function useMoneyContext() {
  const { userDoc, update } = useUserDoc();
  const { rates, stale, loading, error } = useExchangeRates();

  const target: Currency = userDoc?.displayCurrency ?? userDoc?.mainCurrency ?? "USD";
  const scenario: Scenario = userDoc?.scenario ?? DEFAULT_SCENARIO;

  const ctx: MoneyContext = useMemo(
    () => ({ rates: rates ?? IDENTITY_RATES, target, scenario }),
    [rates, target, scenario]
  );

  const setDisplayCurrency = async (currency: Currency) => {
    await update({ displayCurrency: currency });
  };

  return {
    ctx,
    target,
    scenario,
    fxStale: stale,
    fxMissing: !rates,
    fxLoading: loading,
    fxError: error,
    setDisplayCurrency,
  };
}
