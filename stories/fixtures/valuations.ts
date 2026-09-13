import type { InvestmentValuation } from "../../types";
import { monthsAgo, ts, STORY_USER_ID } from "./time";

function val(
  id: string,
  accountId: string,
  domain: InvestmentValuation["domain"],
  monthsBack: number,
  costBasis: number,
  value: number,
  currency: InvestmentValuation["currency"]
): InvestmentValuation {
  const asOf = monthsAgo(monthsBack, 28);
  return {
    id,
    userId: STORY_USER_ID,
    domain,
    accountId,
    asOf: ts(asOf),
    costBasis,
    value,
    gainPct: ((value - costBasis) / costBasis) * 100,
    currency,
    createdAt: ts(asOf),
  };
}

export const STORY_VALUATIONS: InvestmentValuation[] = [
  val("iv-avanza-3", "acc-avanza", "INVESTMENT", 3, 20000, 21100, "SEK"),
  val("iv-avanza-1", "acc-avanza", "INVESTMENT", 1, 30000, 32850, "SEK"),
  val("iv-coinbase-2", "acc-coinbase", "INVESTMENT", 2, 900, 780, "USD"),
  val("iv-coinbase-0", "acc-coinbase", "INVESTMENT", 0, 1200, 1410, "USD"),
  val("iv-emergency-1", "acc-emergency", "SAVING", 1, 2800, 2865, "USD"),
  val("iv-trip-0", "acc-trip", "SAVING", 0, 1400, 1400, "EUR"),
];
