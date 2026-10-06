import { useMemo, useState } from "react";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { enabledCurrencies, toggleCurrency } from "../../../helpers/currencies";
import { currenciesPatch } from "../helpers/currenciesPatch";
import type { Currency } from "../../../types";

/**
 * The Currencies step: your currency (the whole catalog, since there is no
 * choice to read yet) and which currencies the amount pickers offer. Both stay
 * local until `save()`, which the step navigation runs on the way out.
 */
export function useCurrenciesStep() {
  const { userDoc, update } = useUserDoc();
  // null = still following what the user doc says.
  const [picked, setPicked] = useState<Currency | null>(null);
  const [chosen, setChosen] = useState<Currency[] | null>(null);

  const currency = picked ?? userDoc?.mainCurrency ?? "USD";
  const enabled = useMemo(
    () => enabledCurrencies(chosen ?? userDoc?.enabledCurrencies, currency),
    [chosen, userDoc?.enabledCurrencies, currency]
  );

  /** Your currency is always offered: the pickers start every new amount in it. */
  const locked = (c: Currency) => (c === currency ? "Your currency is always available." : null);

  const toggle = (c: Currency) => {
    if (locked(c)) return;
    setChosen(toggleCurrency(enabled, c));
  };

  const save = async () => {
    const patch = currenciesPatch(userDoc, currency, chosen && enabled);
    if (patch) await update(patch);
  };

  return { currency, setCurrency: setPicked, enabled, locked, toggle, save };
}
