import Skeleton from "../../../components/Skeleton";
import { ArrowDown, ArrowUpRight, Circle, TrendingUp } from "../../../components/atoms/Icons";
import { SummaryCard } from "../../../components/molecules/SummaryCard";
import type { SummaryStat } from "../../../components/molecules/SummaryCard";
import type { BadgeTone } from "../../../components/atoms/Badge";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useDateFormat } from "../../../hooks/usePreferences";
import { RUNWAY_CAP_MONTHS } from "../helpers/emergency";
import type { EmergencyBudget } from "../helpers/emergency";
import type { Currency } from "../../../types";

interface Props {
  /** Months the cushion lasts; null when it outlasts the simulation. */
  runway: number | null;
  budget: EmergencyBudget;
  savings: number;
  /** Counted only when `includeInvestments`. */
  investments: number;
  includeInvestments: boolean;
  /** Already in `currency`. */
  benefitMonthly: number;
  benefitMonths: number;
  severance: number;
  currency: Currency;
  loading?: boolean;
  approximate?: boolean;
}

/** Three months is a crisis, six the usual advice. */
function verdict(runway: number | null): { label: string; tone: BadgeTone } {
  if (runway === null) return { label: "Covered", tone: "success" };
  if (runway < 3) return { label: "Critical", tone: "danger" };
  if (runway < 6) return { label: "Tight", tone: "warning" };
  return { label: "Solid", tone: "success" };
}

/**
 * Emergency mode's answer: how many months the cushion lasts if the regular
 * income stops, non-essentials are cancelled and contributions stop — with
 * whatever benefit or severance the owner expects still coming in.
 */
export function RunwayCard({
  runway,
  budget,
  savings,
  investments,
  includeInvestments,
  benefitMonthly,
  benefitMonths,
  severance,
  currency,
  loading = false,
  approximate = false,
}: Props) {
  const { formatAmount, formatNumber } = useMoneyFormat();
  const { formatDate } = useDateFormat();
  const title = "Emergency runway";

  if (loading) {
    return (
      <SummaryCard
        title={title}
        badge={{ label: "Emergency", tone: "danger" }}
        figure={<Skeleton.Box width={180} height={36} />}
      />
    );
  }

  const cushion = savings + (includeInvestments ? investments : 0) + severance;
  const now = new Date();
  const until =
    runway === null
      ? null
      : new Date(now.getFullYear(), now.getMonth() + Math.floor(runway), now.getDate());

  const figure =
    runway === null
      ? `${RUNWAY_CAP_MONTHS / 12}+ years`
      : `${formatNumber(runway, 1)} ${runway === 1 ? "month" : "months"}`;

  const sub =
    runway === null
      ? budget.burnMonthly > 0
        ? "your cushion outlasts the simulation"
        : "nothing essential left to pay"
      : runway === 0
        ? "nothing set aside to cover the essentials"
        : `of essentials covered — until about ${formatDate(until!, "monthYear")}`;

  const stats: SummaryStat[] = [
    {
      key: "cushion",
      label: "Cushion",
      domain: "SAVING",
      Icon: Circle,
      value: formatAmount(cushion, currency),
    },
    {
      key: "burn",
      label: "Essentials / month",
      domain: "EXPENSE",
      Icon: ArrowDown,
      value: formatAmount(budget.burnMonthly, currency),
    },
    {
      key: "benefit",
      label: benefitMonths > 0 ? `Benefit × ${benefitMonths} mo` : "Benefit",
      domain: "INCOME",
      Icon: ArrowUpRight,
      value: benefitMonthly > 0 && benefitMonths > 0 ? formatAmount(benefitMonthly, currency) : "—",
    },
    {
      key: "paused",
      label: "Paused / month",
      domain: "INVESTMENT",
      Icon: TrendingUp,
      value: formatAmount(budget.pausedSpending + budget.pausedContributions, currency),
    },
  ];

  const parts = [
    `${formatAmount(savings, currency)} savings`,
    includeInvestments ? `${formatAmount(investments, currency)} investments` : null,
    severance > 0 ? `${formatAmount(severance, currency)} severance` : null,
  ].filter(Boolean);
  const note = `Cushion: ${parts.join(" + ")}. Regular income stops; debt payments (${formatAmount(budget.debtMonthly, currency)}/mo) continue.`;

  return (
    <SummaryCard
      title={title}
      badge={verdict(runway)}
      figure={
        <RunwayFigure
          text={figure}
          approximate={approximate && runway !== null}
          tone={runway !== null && runway < 3 ? "danger" : "accent"}
        />
      }
      sub={sub}
      stats={stats}
      note={note}
    />
  );
}

/** The headline is a duration, not an Amount, but wears the same size and face. */
function RunwayFigure({
  text,
  approximate,
  tone,
}: {
  text: string;
  approximate: boolean;
  tone: "accent" | "danger";
}) {
  return (
    <span className={`figure figure--${tone}`}>
      {approximate && <span className="approx">≈ </span>}
      {text}
      <style jsx>{`
        .figure {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 1.9rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: var(--accent);
        }

        .figure--danger {
          color: var(--accent-hot);
        }

        .approx {
          color: var(--fg-2);
          font-weight: 400;
        }
      `}</style>
    </span>
  );
}
