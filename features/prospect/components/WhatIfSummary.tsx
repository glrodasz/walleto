import { Amount } from "../../../components/atoms/Amount";
import { ArrowUpRight, Circle, Lightbulb } from "../../../components/atoms/Icons";
import { SummaryCard } from "../../../components/molecules/SummaryCard";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { formatList } from "../../../utils/formatList";
import type { Currency } from "../../../types";
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
  const adjustedNet = currentNet + impact.freedMonthly;
  const count = impact.excludedNames.length;

  const badge =
    adjustedNet < 0
      ? { label: "Over-committed", tone: "danger" as const }
      : count > 0
        ? { label: `${count} cancelled`, tone: "info" as const }
        : { label: "As planned", tone: "neutral" as const };

  return (
    <SummaryCard
      title={count > 0 ? "Net if cancelled" : "Monthly net"}
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
          ? `left each month, ${formatAmount(impact.freedMonthly, currency)} more than today`
          : "left each month — check items to simulate cancelling them"
      }
      stats={[
        {
          key: "today",
          label: "Net today",
          domain: "INCOME",
          Icon: ArrowUpRight,
          value: formatAmount(currentNet, currency),
        },
        {
          key: "month",
          label: "Freed / month",
          domain: "SAVING",
          Icon: Circle,
          value: formatAmount(impact.freedMonthly, currency),
        },
        {
          key: "year",
          label: "Freed / year",
          domain: "INVESTMENT",
          Icon: Lightbulb,
          value: formatAmount(impact.freedAnnual, currency),
        },
      ]}
      note={count > 0 ? `Cancelling ${formatList(impact.excludedNames)}.` : undefined}
    />
  );
}
