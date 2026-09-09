import { useMemo } from "react";
import { useAccounts } from "../../../hooks/useAccounts";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { ACCOUNT_NOUN } from "../../../helpers/accounts";
import type { MoneyContext } from "../../../helpers/aggregations";
import { DOMAIN_CONFIG } from "../../domains/helpers/domainConfig";
import { InvestmentValuePanel } from "./InvestmentValuePanel";
import type { AccountDomain, Category, Currency } from "../../../types";

interface Props {
  domain: AccountDomain;
  category: Category;
  ctx: MoneyContext;
  currency: Currency;
}

const INCEPTION = new Date(2000, 0, 1);

/**
 * The value panels behind one category's drilldown: one per account that
 * holds entries filed under the category, plus one for the entries filed
 * under no account. A category with nothing in it yet still gets the
 * no-account panel, so a first value can be recorded from here.
 */
export function AccountValuePanels({ domain, category, ctx, currency }: Props) {
  const { accounts } = useAccounts(domain);
  const { transactions, loading } = useDomainTransactions(domain, INCEPTION);
  const accent = DOMAIN_CONFIG[domain].accent;
  const noun = ACCOUNT_NOUN[domain].singular;

  const { linked, hasUnassigned } = useMemo(() => {
    const ids = new Set<string>();
    let unassigned = false;
    for (const t of transactions) {
      if (t.categoryId !== category.id) continue;
      if (t.accountId) ids.add(t.accountId);
      else unassigned = true;
    }
    return {
      linked: accounts.filter((a) => a.id && ids.has(a.id)),
      hasUnassigned: unassigned,
    };
  }, [transactions, accounts, category.id]);

  if (!category.id) return null;
  const showCategory = hasUnassigned || linked.length === 0;

  return (
    <>
      {linked.map((a) => (
        <InvestmentValuePanel
          key={a.id}
          selector={{ accountId: a.id! }}
          title={a.name}
          rate={a.interestRate}
          transactions={transactions}
          loading={loading}
          ctx={ctx}
          currency={currency}
          accent={accent}
        />
      ))}
      {showCategory && (
        <InvestmentValuePanel
          key={category.id}
          selector={{ categoryId: category.id }}
          title={linked.length > 0 ? `${category.name} · no ${noun}` : category.name}
          transactions={transactions}
          loading={loading}
          ctx={ctx}
          currency={currency}
          accent={accent}
        />
      )}
    </>
  );
}
