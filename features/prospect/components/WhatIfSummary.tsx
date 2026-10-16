import { Amount } from "../../../components/atoms/Amount";
import { ArrowUpRight, Circle, Lightbulb } from "../../../components/atoms/Icons";
import { SummaryCard } from "../../../components/molecules/SummaryCard";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { formatList } from "../../../utils/formatList";
import { useT } from "../../../hooks/useT";
import { COMMON_MESSAGES } from "../../../messages/common";
import type { Currency } from "../../../types";
import { PROSPECT_MESSAGES } from "../messages";
import type { WhatIfImpact } from "../helpers/whatIfImpact";

interface Props {
  impact: WhatIfImpact;
  currentNet: number;
  currency: Currency;
  /** Aggregates converted with real FX rates get the "≈" marker. */
  approximate?: boolean;
}

/**
 * The payoff of the simulation, in the dashboard hero's shape: the monthly
 * net after the cancellations on the left, what it's made of on the right,
 * and the cancelled items named underneath.
 */
export function WhatIfSummary({ impact, currentNet, currency, approximate = false }: Props) {
  const { formatAmount } = useMoneyFormat();
  const tc = useT(COMMON_MESSAGES);
  const t = useT(PROSPECT_MESSAGES);
  const adjustedNet = currentNet + impact.freedMonthly;
  const count = impact.excludedNames.length;

  const badge =
    adjustedNet < 0
      ? { label: t("summary.overCommitted"), tone: "danger" as const }
      : count > 0
        ? { label: t("summary.cancelled", { count }), tone: "info" as const }
        : { label: t("summary.asPlanned"), tone: "neutral" as const };

  return (
    <SummaryCard
      title={count > 0 ? t("summary.titleCancelled") : t("summary.title")}
      badge={badge}
      figure={
        <Amount
          value={adjustedNet}
          currency={currency}
          size="lg"
          colorize
          approximate={approximate}
        />
      }
      sub={
        count > 0
          ? t("summary.subCancelled", { amount: formatAmount(impact.freedMonthly, currency) })
          : t("summary.sub")
      }
      stats={[
        {
          key: "today",
          label: t("summary.netToday"),
          domain: "INCOME",
          Icon: ArrowUpRight,
          value: formatAmount(currentNet, currency),
        },
        {
          key: "month",
          label: t("summary.freedMonth"),
          domain: "SAVING",
          Icon: Circle,
          value: formatAmount(impact.freedMonthly, currency),
        },
        {
          key: "year",
          label: t("summary.freedYear"),
          domain: "INVESTMENT",
          Icon: Lightbulb,
          value: formatAmount(impact.freedAnnual, currency),
        },
      ]}
      note={
        count > 0
          ? t("summary.note", { names: formatList(impact.excludedNames, tc("list.and")) })
          : undefined
      }
    />
  );
}
