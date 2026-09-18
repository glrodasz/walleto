import { useMemo } from "react";
import { useAllInvestmentValuations } from "../../../hooks/useInvestmentValuations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { monthGains, valuationGainRows } from "../helpers/valuationGains";
import type { GainRow } from "../helpers/valuationGains";
import type { AccountDomain, Category } from "../../../types";

/**
 * The gain a domain's value checks reported, month by month, ready to add to
 * the page's totals and to cap its bars. Inert for a null domain, so the two
 * domains without accounts share the page without opening a listener here.
 */
export function useDomainGains(
  domain: AccountDomain | null,
  categories: Category[],
  ctx: MoneyContext,
  windows: { key: string }[]
): { gains: Record<string, number>; rows: GainRow[]; loading: boolean; error: Error | null } {
  const { valuations, loading, error } = useAllInvestmentValuations(Boolean(domain));

  const rows = useMemo(
    () => (domain ? valuationGainRows(valuations, domain, categories, ctx) : []),
    [domain, valuations, categories, ctx]
  );
  const gains = useMemo(
    () =>
      domain
        ? monthGains(valuations, domain, categories, ctx, windows)
        : Object.fromEntries(windows.map((w) => [w.key, 0])),
    [domain, valuations, categories, ctx, windows]
  );

  return { gains, rows, loading, error };
}
