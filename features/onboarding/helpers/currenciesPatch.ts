import type { UserDoc } from "../../../hooks/useUserDoc";
import type { UserUpdate } from "../../../schemas";
import type { Currency } from "../../../types";

/**
 * What the Currencies step writes on the user doc: one currency choice, so the
 * main and the display currency move together (Settings works the same way),
 * plus the list of offered currencies — only once the owner touched the chips,
 * so an untouched step keeps following the defaults.
 */
export function currenciesPatch(
  userDoc: Pick<UserDoc, "mainCurrency" | "displayCurrency" | "enabledCurrencies"> | null,
  currency: Currency,
  chosen: Currency[] | null
): UserUpdate | null {
  const patch: UserUpdate = {};
  if (currency !== userDoc?.mainCurrency) patch.mainCurrency = currency;
  if (currency !== (userDoc?.displayCurrency ?? userDoc?.mainCurrency)) {
    patch.displayCurrency = currency;
  }
  if (chosen && chosen.join() !== (userDoc?.enabledCurrencies ?? []).join()) {
    patch.enabledCurrencies = chosen;
  }
  return Object.keys(patch).length ? patch : null;
}
