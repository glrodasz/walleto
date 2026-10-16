import { Amount } from "../../../components/atoms/Amount";
import Skeleton from "../../../components/Skeleton";
import { Circle, CreditCard, TrendingUp } from "../../../components/atoms/Icons";
import { SummaryCard } from "../../../components/molecules/SummaryCard";
import type { SummaryStat } from "../../../components/molecules/SummaryCard";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useDateFormat } from "../../../hooks/usePreferences";
import type { NetWorth } from "../helpers/netWorth";
import type { Currency } from "../../../types";
import { useT } from "../../../hooks/useT";
import { DASHBOARD_MESSAGES } from "../messages";

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
  const t = useT(DASHBOARD_MESSAGES);
  const badge = { label: t("worth.today"), tone: "info" } as const;

  if (loading) {
    return (
      <SummaryCard
        title={t("worth.title")}
        badge={badge}
        figure={<Skeleton.Box width={180} height={36} />}
      />
    );
  }

  if (worth.empty) {
    return <SummaryCard title={t("worth.title")} badge={badge} sub={t("worth.empty")} />;
  }

  const stats: SummaryStat[] = [
    {
      key: "investments",
      label: t("worth.investments"),
      domain: "INVESTMENT",
      Icon: TrendingUp,
      value: formatAmount(worth.investments, currency),
    },
    {
      key: "savings",
      label: t("worth.savings"),
      domain: "SAVING",
      Icon: Circle,
      value: formatAmount(worth.savings, currency),
    },
    {
      key: "debts",
      label: t("worth.debts"),
      domain: "DEBT",
      Icon: CreditCard,
      value: worth.debtsUnknown ? "—" : formatAmount(worth.debts, currency),
    },
  ];

  const date = worth.lastCheckedAt ? formatDate(worth.lastCheckedAt, "day") : null;
  const sub = date
    ? t(worth.estimated ? "worth.sub.checkedEstimated" : "worth.sub.checked", { date })
    : t(worth.estimated ? "worth.sub.estimated" : "worth.sub");

  return (
    <SummaryCard
      title={t("worth.title")}
      badge={badge}
      figure={
        <Amount
          value={worth.net}
          currency={currency}
          size="lg"
          markNegative
          approximate={approximate}
        />
      }
      sub={sub}
      stats={stats}
      note={worth.debtsUnknown ? t("worth.debtsUnknown") : undefined}
    />
  );
}
