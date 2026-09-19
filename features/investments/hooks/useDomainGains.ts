import { useMemo } from "react";
import { useAllInvestmentValuations } from "../../../hooks/useInvestmentValuations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { monthGains, valuationGainRows } from "../helpers/valuationGains";
import type { GainRow } from "../helpers/valuationGains";
import type { AccountDomain, Category, Transaction } from "../../../types";

/**
 * The gain a domain's value checks reported, month by month, ready to add to
 * the page's totals and to cap its bars. Inert for a null domain, so the two
 * domains without accounts share the page without opening a listener here.
 *
 * `transactions` must reach back to inception — a check is measured against
 * everything paid in before it — and nothing is reported until they have
 * loaded: measured against an empty ledger, every check would flash its whole
 * value as one month's gain.
 */
export function useDomainGains(
  domain: AccountDomain | null,
  transactions: Transaction[],
  transactionsReady: boolean,
  categories: Category[],
  ctx: MoneyContext,
  windows: { key: string }[]
): { gains: Record<string, number>; rows: GainRow[]; loading: boolean; error: Error | null } {
  const { valuations, loading, error } = useAllInvestmentValuations(Boolean(domain));
  const active = domain && transactionsReady ? domain : null;

  const rows = useMemo(
    () => (active ? valuationGainRows(valuations, transactions, active, categories, ctx) : []),
    [active, valuations, transactions, categories, ctx]
  );
  const gains = useMemo(
    () =>
      active
        ? monthGains(valuations, transactions, active, categories, ctx, windows)
        : Object.fromEntries(windows.map((w) => [w.key, 0])),
    [active, valuations, transactions, categories, ctx, windows]
  );

  return { gains, rows, loading, error };
}
