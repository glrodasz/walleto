import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { useDateFormat } from "../../../hooks/usePreferences";
import { useDomainValue } from "../hooks/useDomainValue";
import { useT } from "../../../hooks/useT";
import { INVESTMENT_MESSAGES } from "../messages";
import type { AccountDomain, Category, Currency } from "../../../types";

interface Props {
  domain: AccountDomain;
  /** Every domain's categories, so pre-account valuations resolve correctly. */
  categories: Pick<Category, "id" | "domain">[];
  currency: Currency;
}

/**
 * What a domain's accounts hold today — or, for debts, what they still owe —
 * under the card's monthly figure. The figure above is a plan run-rate and
 * this is a balance, so it says "Worth" / "Owed" and stays a caption — the
 * two must never read as the same kind of number. A debt has no balance
 * until one is recorded, so the line waits for the first check.
 *
 * Its own component because it opens the inception-to-date listener a value
 * needs, and a hook cannot be called conditionally per card.
 */
export function DomainValueLine({ domain, categories, currency }: Props) {
  const { ctx } = useMoneyContext();
  const { formatAmount } = useMoneyFormat();
  const { formatDate } = useDateFormat();
  const t = useT(INVESTMENT_MESSAGES);
  const { rows, value, lastCheckedAt, loading } = useDomainValue(domain, categories, ctx);
  const owes = domain === "DEBT";

  if (loading || rows.length === 0 || (owes && !lastCheckedAt)) return null;
  // No check anywhere, but a quoted rate somewhere: the figure is compounded,
  // not stated, and the line has to admit it.
  const estimated = !lastCheckedAt && rows.some((r) => r.rate);
  const amount = formatAmount(value, currency);
  const text = lastCheckedAt
    ? t(owes ? "line.owed.checked" : "line.worth.checked", {
        amount,
        date: formatDate(lastCheckedAt, "day"),
      })
    : t(estimated ? "line.worth.estimated" : "line.worth", { amount });

  return (
    <span className="worth">
      {text}
      <style jsx>{`
        .worth {
          font-size: 0.72rem;
          color: var(--fg-2);
        }
      `}</style>
    </span>
  );
}
