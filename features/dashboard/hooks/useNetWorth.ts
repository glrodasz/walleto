import { useDomainValue } from "../../investments/hooks/useDomainValue";
import { netWorth } from "../helpers/netWorth";
import type { NetWorth, PositionPart } from "../helpers/netWorth";
import type { MoneyContext } from "../../../helpers/aggregations";
import type { Category } from "../../../types";

function part(v: ReturnType<typeof useDomainValue>): PositionPart {
  return {
    value: v.value,
    hasRows: v.rows.length > 0,
    lastCheckedAt: v.lastCheckedAt,
    estimated: !v.lastCheckedAt && v.rows.some((r) => r.rate),
  };
}

/**
 * The owner's position today across investments, savings and debts. Opens
 * the same inception-to-date listeners as the dashboard's "Worth …" lines;
 * the SDK folds identical queries into one target, so it adds no reads.
 */
export function useNetWorth(
  categories: Pick<Category, "id" | "domain">[],
  ctx: MoneyContext
): NetWorth & { loading: boolean } {
  const investments = useDomainValue("INVESTMENT", categories, ctx);
  const savings = useDomainValue("SAVING", categories, ctx);
  const debts = useDomainValue("DEBT", categories, ctx);
  const loading = investments.loading || savings.loading || debts.loading;

  const result = netWorth({
    investments: part(investments),
    savings: part(savings),
    debts: part(debts),
  });

  return { ...result, loading };
}
