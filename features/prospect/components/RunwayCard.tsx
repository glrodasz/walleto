import Skeleton from "../../../components/Skeleton";
import { ArrowDown, ArrowUpRight, Circle, TrendingUp } from "../../../components/atoms/Icons";
import { SummaryCard } from "../../../components/molecules/SummaryCard";
import type { SummaryStat } from "../../../components/molecules/SummaryCard";
import type { BadgeTone } from "../../../components/atoms/Badge";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useDateFormat } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import type { Translator } from "../../../helpers/i18n";
import { PROSPECT_MESSAGES } from "../messages";
import { RUNWAY_CAP_MONTHS } from "../helpers/emergency";
import { formatRunway } from "../helpers/runwayDuration";
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
function verdict(
  runway: number | null,
  t: Translator<(typeof PROSPECT_MESSAGES)["en"]>
): { label: string; tone: BadgeTone } {
  if (runway === null) return { label: t("runway.covered"), tone: "success" };
  if (runway < 3) return { label: t("runway.critical"), tone: "danger" };
  if (runway < 6) return { label: t("runway.tight"), tone: "warning" };
  return { label: t("runway.solid"), tone: "success" };
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
  const { formatDate, language } = useDateFormat();
  const t = useT(PROSPECT_MESSAGES);
  const title = t("runway.title");

  if (loading) {
    return (
      <SummaryCard
        title={title}
        badge={{ label: t("runway.badge"), tone: "danger" }}
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
      ? t("runway.cap", { count: RUNWAY_CAP_MONTHS / 12 })
      : formatRunway(runway, formatNumber, language);

  const sub =
    runway === null
      ? budget.burnMonthly > 0
        ? t("runway.outlasts")
        : t("runway.nothingToPay")
      : runway === 0
        ? t("runway.nothingSaved")
        : t("runway.until", { date: formatDate(until!, "monthYear") });

  const stats: SummaryStat[] = [
    {
      key: "cushion",
      label: t("runway.cushion"),
      domain: "SAVING",
      Icon: Circle,
      value: formatAmount(cushion, currency),
    },
    {
      key: "burn",
      label: t("runway.burn"),
      domain: "EXPENSE",
      Icon: ArrowDown,
      value: formatAmount(budget.burnMonthly, currency),
    },
    {
      key: "benefit",
      label:
        benefitMonths > 0 ? t("runway.benefitFor", { count: benefitMonths }) : t("runway.benefit"),
      domain: "INCOME",
      Icon: ArrowUpRight,
      value: benefitMonthly > 0 && benefitMonths > 0 ? formatAmount(benefitMonthly, currency) : "—",
    },
    {
      key: "paused",
      label: t("runway.paused"),
      domain: "INVESTMENT",
      Icon: TrendingUp,
      value: formatAmount(budget.pausedSpending + budget.pausedContributions, currency),
    },
  ];

  const parts = [
    t("runway.part.savings", { amount: formatAmount(savings, currency) }),
    includeInvestments
      ? t("runway.part.investments", { amount: formatAmount(investments, currency) })
      : null,
    severance > 0
      ? t("runway.part.severance", { amount: formatAmount(severance, currency) })
      : null,
  ].filter(Boolean);
  const note = t("runway.note", {
    parts: parts.join(" + "),
    amount: formatAmount(budget.debtMonthly, currency),
  });

  return (
    <SummaryCard
      title={title}
      badge={verdict(runway, t)}
      figure={
        <RunwayFigure
          text={figure}
          approximate={approximate && runway !== null}
          tone={runway !== null && runway < 3 ? "danger" : "positive"}
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
  tone: "positive" | "danger";
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
          color: var(--positive);
        }

        .figure--danger {
          color: var(--negative);
        }

        .approx {
          color: var(--fg-2);
          font-weight: 400;
        }
      `}</style>
    </span>
  );
}
