import { Amount } from "../../../components/atoms/Amount";
import {
  ArrowDown,
  ArrowUpRight,
  Circle,
  CreditCard,
  TrendingUp,
} from "../../../components/atoms/Icons";
import { AllocationBar } from "./AllocationBar";
import { SummaryCard } from "./SummaryCard";
import type { SummaryStat } from "./SummaryCard";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import type { Currency } from "../../../types";
import type { MoneyFlow } from "../../../helpers";

interface Props {
  flow: MoneyFlow;
  currency: Currency;
  /** Aggregates converted with real FX rates get the "≈" marker. */
  approximate?: boolean;
}

const STATS: (Omit<SummaryStat, "value"> & { key: keyof MoneyFlow })[] = [
  { key: "income", label: "Income", domain: "INCOME", Icon: ArrowUpRight },
  { key: "expenses", label: "Expenses", domain: "EXPENSE", Icon: ArrowDown },
  { key: "investments", label: "Investments", domain: "INVESTMENT", Icon: TrendingUp },
  { key: "savings", label: "Savings", domain: "SAVING", Icon: Circle },
  { key: "debts", label: "Debts", domain: "DEBT", Icon: CreditCard },
];

/**
 * The hero figure: monthly net = income − expenses − savings − investments −
 * debt repayments (the owner's definition — cash left unallocated). Savings
 * and investments are money that stays yours, and a repayment is money that
 * stops being owed, so each gets its own slice of the allocation bar instead
 * of being lumped in with spending. Every number here is the plan's monthly
 * run-rate, and the pill says whether the plan fits inside the income.
 */
export function NetFlowCard({ flow, currency, approximate = false }: Props) {
  const { formatAmount } = useMoneyFormat();
  // The verdict the pill gives: does the plan fit inside what comes in?
  const overCommitted = flow.net < 0;

  return (
    <SummaryCard
      title="Monthly plan"
      badge={
        overCommitted
          ? { label: "Over-committed", tone: "danger" }
          : { label: "On plan", tone: "success" }
      }
      figure={
        <Amount value={flow.net} currency={currency} size="lg" colorize approximate={approximate} />
      }
      sub={
        overCommitted
          ? "more planned out than coming in, each month"
          : "left to allocate each month"
      }
      stats={STATS.map((s) => ({ ...s, value: formatAmount(flow[s.key], currency) }))}
      footer={<AllocationBar flow={flow} />}
    />
  );
}
