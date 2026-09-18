import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { useDateFormat } from "../../../hooks/usePreferences";
import { useDomainValue } from "../hooks/useDomainValue";
import type { AccountDomain, Category, Currency } from "../../../types";

interface Props {
  domain: AccountDomain;
  /** Every domain's categories, so pre-account valuations resolve correctly. */
  categories: Pick<Category, "id" | "domain">[];
  currency: Currency;
}

/**
 * What a domain's accounts hold today, under the card's monthly figure. The
 * figure above is a plan run-rate and this is a balance, so it says "Worth"
 * and stays a caption — the two must never read as the same kind of number.
 *
 * Its own component because it opens the inception-to-date listener a value
 * needs, and a hook cannot be called conditionally per card.
 */
export function DomainValueLine({ domain, categories, currency }: Props) {
  const { ctx } = useMoneyContext();
  const { formatAmount } = useMoneyFormat();
  const { formatDate } = useDateFormat();
  const { rows, value, lastCheckedAt, loading } = useDomainValue(domain, categories, ctx);

  if (loading || rows.length === 0) return null;
  // No check anywhere, but a quoted rate somewhere: the figure is compounded,
  // not stated, and the line has to admit it.
  const estimated = !lastCheckedAt && rows.some((r) => r.rate);

  return (
    <span className="worth">
      Worth {formatAmount(value, currency)}
      {lastCheckedAt
        ? ` · checked ${formatDate(lastCheckedAt, "day")}`
        : estimated
          ? " · estimated"
          : ""}
      <style jsx>{`
        .worth {
          font-size: 0.72rem;
          color: var(--fg-2);
        }
      `}</style>
    </span>
  );
}
