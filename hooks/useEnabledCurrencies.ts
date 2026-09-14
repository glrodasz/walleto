import { useMemo } from "react";
import { useUserDoc } from "./useUserDoc";
import { currencyOptions, enabledCurrencies } from "../helpers/currencies";
import type { Currency } from "../types";

/**
 * The one place that decides which currencies a picker offers: the user's
 * choice from Settings (`users.enabledCurrencies`), or USD/EUR/GBP until they
 * make one — always with their main and display currencies folded in.
 *
 * Any select of a currency uses this, never `SELECTABLE_CURRENCIES`; the only
 * exception is the onboarding picker, which runs before there is a user doc
 * to read a choice from.
 */
export function useEnabledCurrencies() {
  const { userDoc, update } = useUserDoc();
  const chosen = userDoc?.enabledCurrencies;
  const main = userDoc?.mainCurrency;
  const display = userDoc?.displayCurrency;

  const currencies = useMemo(
    () => enabledCurrencies(chosen, main, display),
    [chosen, main, display]
  );
  const options = useMemo(() => currencyOptions(currencies), [currencies]);

  /**
   * Options for a field that already holds a value: a record entered in a
   * currency since turned off still shows its own currency, instead of the
   * select silently snapping to another one.
   */
  const optionsFor = (value?: Currency | null | "") =>
    value && !currencies.includes(value)
      ? currencyOptions(enabledCurrencies(currencies, value))
      : options;

  const setEnabledCurrencies = async (next: Currency[]) => {
    if (!next.length) return;
    await update({ enabledCurrencies: next });
  };

  return { currencies, options, optionsFor, setEnabledCurrencies };
}
