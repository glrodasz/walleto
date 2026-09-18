import { useMemo } from "react";
import { useAccounts } from "../../../hooks/useAccounts";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useAllInvestmentValuations } from "../../../hooks/useInvestmentValuations";
import { ACCOUNT_NOUN } from "../../../helpers/accounts";
import type { MoneyContext } from "../../../helpers/aggregations";
import { withDomain } from "../helpers/valuation";
import { domainValueRows, domainValueTotals } from "../helpers/domainValue";
import type { AccountValueRow } from "../helpers/domainValue";
import type { AccountDomain, Category, InvestmentValuation, Transaction } from "../../../types";

/** A cost basis needs the position's whole history, not a page's month. */
const INCEPTION = new Date(2000, 0, 1);

/**
 * What a domain's accounts and pockets are worth right now, per account and in
 * total. Its transactions listener reaches back to inception, so mount this
 * only where the figure is actually shown.
 *
 * `categories` is passed in rather than fetched so the caller reuses the
 * subscription it already has — and so a caller holding every domain's
 * categories resolves pre-account valuations better than a scoped list would.
 */
export function useDomainValue(
  domain: AccountDomain,
  categories: Pick<Category, "id" | "domain">[],
  ctx: MoneyContext
): {
  rows: AccountValueRow[];
  invested: number;
  value: number;
  lastCheckedAt: Date | null;
  /** Inception-to-date, for the panels that chart a single position. */
  transactions: Transaction[];
  /** Every valuation, domains filled in. */
  valuations: InvestmentValuation[];
  loading: boolean;
  error: Error | null;
} {
  const { accounts, loading: accLoading, error: accError } = useAccounts(domain);
  const { transactions, loading: txLoading } = useDomainTransactions(domain, INCEPTION);
  const { valuations: raw, loading: valLoading, error: valError } = useAllInvestmentValuations();

  const valuations = useMemo(() => withDomain(raw, categories), [raw, categories]);
  const now = useMemo(() => new Date(), []);
  const rows = useMemo(
    () =>
      domainValueRows(
        accounts,
        transactions,
        valuations,
        domain,
        ACCOUNT_NOUN[domain].singular,
        ctx,
        now
      ),
    [accounts, transactions, valuations, domain, ctx, now]
  );
  const totals = useMemo(() => domainValueTotals(rows), [rows]);

  return {
    rows,
    ...totals,
    transactions,
    valuations,
    loading: accLoading || txLoading || valLoading,
    error: valError ?? accError,
  };
}
