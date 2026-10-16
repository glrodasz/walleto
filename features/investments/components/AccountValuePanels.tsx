import { useMemo } from "react";
import { useAccounts } from "../../../hooks/useAccounts";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useAllInvestmentValuations } from "../../../hooks/useInvestmentValuations";
import { accountLabel } from "../../../helpers/accounts";
import { useT } from "../../../hooks/useT";
import { INVESTMENT_MESSAGES } from "../messages";
import type { MoneyContext } from "../../../helpers/aggregations";
import { DOMAIN_CONFIG } from "../../domains/helpers/domainConfig";
import { INCEPTION, withDomain } from "../helpers/valuation";
import { InvestmentValuePanel } from "./InvestmentValuePanel";
import type { AccountDomain, Category, Currency } from "../../../types";

interface Props {
  domain: AccountDomain;
  category: Category;
  categories: Category[];
  ctx: MoneyContext;
  currency: Currency;
}

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
  const t = useT(INVESTMENT_MESSAGES);

  const linked = useMemo(() => {
    const ids = new Set<string>();
    for (const t of transactions) {
      if (t.categoryId === category.id && t.accountId) ids.add(t.accountId);
    }
    return accounts.filter((a) => a.id && ids.has(a.id));
  }, [transactions, accounts, category.id]);

  if (!category.id) return null;

  const shared = {
    domain,
    transactions,
    valuations,
    loading: loading || valLoading,
    categories,
    // The drilldown is already inside one category, so a gain recorded from
    // here belongs to it — no guessing needed.
    suggestedCategoryId: category.id,
    ctx,
    currency,
    accent,
  };
  if (linked.length === 0) {
    return <InvestmentValuePanel selector={{ domain }} title={t(`bucket.${domain}`)} {...shared} />;
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
