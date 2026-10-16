import { Amount } from "../atoms/Amount";
import { ArrowDown, ArrowUpRight, Circle, CreditCard, TrendingUp } from "../atoms/Icons";
import { SummaryCard } from "../molecules/SummaryCard";
import type { SummaryStat } from "../molecules/SummaryCard";
import { useMoneyFormat } from "../../hooks/useMoneyFormat";
import { useT } from "../../hooks/useT";
import { CHART_MESSAGES } from "../../messages/charts";
import { COMMON_MESSAGES } from "../../messages/common";
import type { Currency } from "../../types";
import type { MoneyFlow } from "../../helpers";

interface Props {
  flow: MoneyFlow;
  currency: Currency;
  /** Aggregates converted with real FX rates get the "≈" marker. */
  approximate?: boolean;
  /**
   * Which domain stats sit beside the figure; all five by default. The
   * onboarding review only has income and expenses to show.
   */
  stats?: (keyof MoneyFlow)[];
}

const STATS: (Omit<SummaryStat, "value" | "label"> & { key: keyof MoneyFlow })[] = [
  { key: "income", domain: "INCOME", Icon: ArrowUpRight },
  { key: "expenses", domain: "EXPENSE", Icon: ArrowDown },
  { key: "investments", domain: "INVESTMENT", Icon: TrendingUp },
  { key: "savings", domain: "SAVING", Icon: Circle },
  { key: "debts", domain: "DEBT", Icon: CreditCard },
];

/**
 * The hero figure: monthly net = income − expenses − savings − investments −
 * debt repayments (the owner's definition — cash left unallocated). Savings
 * and investments are money that stays yours, and a repayment is money that
 * stops being owed, so each gets its own stat instead of being lumped in with
 * spending. Every number here is the plan's monthly
 * run-rate, and the pill says whether the plan fits inside the income.
 */
export function NetFlowCard({ flow, currency, approximate = false, stats }: Props) {
  const { formatAmount } = useMoneyFormat();
  const t = useT(CHART_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  // The verdict the pill gives: does the plan fit inside what comes in?
  const overCommitted = flow.net < 0;

  return (
    <SummaryCard
      title={t("netFlow.title")}
      badge={
        overCommitted
          ? { label: t("netFlow.overCommitted"), tone: "danger" }
          : { label: t("netFlow.onPlan"), tone: "success" }
      }
      figure={
        <Amount
          value={flow.net}
          currency={currency}
          size="lg"
          markNegative
          approximate={approximate}
        />
      }
      sub={overCommitted ? t("netFlow.overSub") : t("netFlow.leftSub")}
      stats={STATS.filter((s) => !stats || stats.includes(s.key)).map((s) => ({
        ...s,
        label: tc(`domain.${s.domain}`),
        value: formatAmount(flow[s.key], currency),
      }))}
    />
  );
}
