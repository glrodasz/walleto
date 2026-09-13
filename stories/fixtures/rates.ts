import type { ExchangeRates } from "../../helpers/fx";
import type { MoneyContext } from "../../helpers/aggregations";

export { IDENTITY_RATES } from "../../helpers/fx";

/** Units of each currency per 1 USD; plausible, not live. */
export const STORY_RATES: ExchangeRates = {
  base: "USD",
  rates: { USD: 1, EUR: 0.92, MXN: 17.2, GBP: 0.79, SEK: 10.6, CHF: 0.88, JPY: 149.5, COP: 4100 },
  fetchedAt: "2026-09-01T00:00:00.000Z",
};

/** The money context every page builds through `useMoneyContext`. */
export const STORY_CTX: MoneyContext = { rates: STORY_RATES, target: "USD" };
