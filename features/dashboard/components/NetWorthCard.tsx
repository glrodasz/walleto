import { Amount } from "../../../components/atoms/Amount";
import Skeleton from "../../../components/Skeleton";
import { Circle, CreditCard, TrendingUp } from "../../../components/atoms/Icons";
import { SummaryCard } from "./SummaryCard";
import type { SummaryStat } from "./SummaryCard";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useDateFormat } from "../../../hooks/usePreferences";
import type { NetWorth } from "../helpers/netWorth";
import type { Currency } from "../../../types";

interface Props {
  worth: NetWorth;
  currency: Currency;
  loading?: boolean;
  /** Aggregates converted with real FX rates get the "≈" marker. */
  approximate?: boolean;
}

/**
 * Where the owner stands today: investments and savings minus what the debts
 * still owe. The card above is the plan (a monthly run-rate); this is a
 * position (a balance), so it says "Today" and never shares a figure with it.
 */
export function NetWorthCard({ worth, currency, loading = false, approximate = false }: Props) {
  const { formatAmount } = useMoneyFormat();
  const { formatDate } = useDateFormat();
  const badge = { label: "Today", tone: "info" } as const;

  if (loading) {
    return (
      <SummaryCard
        title="Net worth"
        badge={badge}
        figure={<Skeleton.Box width={180} height={36} />}
      />
    );
  }

  if (worth.empty) {
    return (
      <SummaryCard
        title="Net worth"
        badge={badge}
        sub="Add your investment accounts, savings pockets and debts, then update what each is worth from the + button to see where you stand."
      />
    );
  }

  const stats: SummaryStat[] = [
    {
      key: "investments",
      label: "Investments",
      domain: "INVESTMENT",
      Icon: TrendingUp,
      value: formatAmount(worth.investments, currency),
    },
    {
      key: "savings",
      label: "Savings",
      domain: "SAVING",
      Icon: Circle,
      value: formatAmount(worth.savings, currency),
    },
    {
      key: "debts",
      label: "Owed on debts",
      domain: "DEBT",
      Icon: CreditCard,
      value: worth.debtsUnknown ? "—" : formatAmount(worth.debts, currency),
    },
  ];

  const sub = [
    "What you own minus what you owe",
    worth.lastCheckedAt ? `last checked ${formatDate(worth.lastCheckedAt, "day")}` : null,
    worth.estimated ? "partly estimated" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <SummaryCard
      title="Net worth"
      badge={badge}
      figure={
        <Amount
          value={worth.net}
          currency={currency}
          size="lg"
          colorize
          approximate={approximate}
        />
      }
      sub={sub}
      stats={stats}
      note={
        worth.debtsUnknown
          ? "A debt has no recorded balance yet, so it isn't counted. Update its balance to include it."
          : undefined
      }
    />
  );
}
