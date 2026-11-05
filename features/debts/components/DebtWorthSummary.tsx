import { useMemo } from "react";
import type { ComponentProps } from "react";
import type { MoneyContext } from "../../../helpers/aggregations";
import { usePreferences } from "../../../hooks/usePreferences";
import { useDomainValue } from "../../investments/hooks/useDomainValue";
import { domainValueRows, domainValueTotals } from "../../investments/helpers/domainValue";
import { WorthSummary } from "../../domains/components/WorthSummary";
import type { Category } from "../../../types";

type Props = Omit<ComponentProps<typeof WorthSummary>, "domain" | "worth" | "previous"> & {
  /** The DEBT categories. */
  categories: Category[];
  ctx: MoneyContext;
  /** Where "owed" is read: today in the current month, else the month's end. */
  end: Date;
  /** The month's start: what was owed at the end of the month before. */
  start: Date;
};

/**
 * The Debts page's Total, read the way the Owed list reads each debt — the
 * same balance model, interest settled at each payment (`debtValueAt`) — so
 * the figure on top is always the sum of the list underneath.
 */
export function DebtWorthSummary({ categories, ctx, end, start, ...summary }: Props) {
  const { accounts, transactions, valuations } = useDomainValue("DEBT", categories, ctx);
  const { language } = usePreferences();
  const owedAt = (at: Date) =>
    domainValueTotals(
      domainValueRows(accounts, transactions, valuations, "DEBT", ctx, at, language)
    ).value;
  const worth = useMemo(
    () => owedAt(end),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accounts, transactions, valuations, ctx, end, language]
  );
  const previous = useMemo(
    () => owedAt(start),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accounts, transactions, valuations, ctx, start, language]
  );
  return <WorthSummary {...summary} domain="DEBT" worth={worth} previous={previous} />;
}
