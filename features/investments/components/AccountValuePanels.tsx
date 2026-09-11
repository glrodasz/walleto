import { useMemo } from "react";
import { useAccounts } from "../../../hooks/useAccounts";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useAllInvestmentValuations } from "../../../hooks/useInvestmentValuations";
import { ACCOUNT_NOUN, accountLabel } from "../../../helpers/accounts";
import type { MoneyContext } from "../../../helpers/aggregations";
import { DOMAIN_CONFIG } from "../../domains/helpers/domainConfig";
import { withDomain } from "../helpers/valuation";
import { InvestmentValuePanel } from "./InvestmentValuePanel";
import type { AccountDomain, Category, Currency } from "../../../types";

interface Props {
  domain: AccountDomain;
  category: Category;
  categories: Category[];
  ctx: MoneyContext;
  currency: Currency;
}

const INCEPTION = new Date(2000, 0, 1);

/**
 * The value panels behind one category's drilldown: one per account that
 * holds entries filed under the category. A category whose entries sit
 * under no account gets the domain's "No account" bucket instead, so a
 * value can still be recorded from here.
 */
export function AccountValuePanels({ domain, category, categories, ctx, currency }: Props) {
  const { accounts } = useAccounts(domain);
  const { transactions, loading } = useDomainTransactions(domain, INCEPTION);
  const { valuations: rawValuations, loading: valLoading } = useAllInvestmentValuations();
  const valuations = useMemo(
    () => withDomain(rawValuations, categories),
    [rawValuations, categories]
  );
  const accent = DOMAIN_CONFIG[domain].accent;
  const noun = ACCOUNT_NOUN[domain].singular;

  const linked = useMemo(() => {
    const ids = new Set<string>();
    for (const t of transactions) {
      if (t.categoryId === category.id && t.accountId) ids.add(t.accountId);
    }
    return accounts.filter((a) => a.id && ids.has(a.id));
  }, [transactions, accounts, category.id]);

  if (!category.id) return null;

  const shared = {
    transactions,
    valuations,
    loading: loading || valLoading,
    ctx,
    currency,
    accent,
  };
  if (linked.length === 0) {
    return <InvestmentValuePanel selector={{ domain }} title={`No ${noun}`} {...shared} />;
  }
  return (
    <>
      {linked.map((a) => (
        <InvestmentValuePanel
          key={a.id}
          selector={{ accountId: a.id! }}
          title={accountLabel(a)}
          rate={a.interestRate}
          {...shared}
        />
      ))}
    </>
  );
}
