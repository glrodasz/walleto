import type { ReactNode } from "react";
import { Card } from "../../../components/atoms/Card";
import { Amount } from "../../../components/atoms/Amount";
import { DeltaPill } from "../../../components/molecules/DeltaPill";
import { ProgressBar } from "../../../components/molecules/ProgressBar";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
import { SLOT, splitSlot } from "../helpers/slot";
import { useT } from "../../../hooks/useT";
import { DOMAIN_MESSAGES } from "../messages";
import type { MonthDelta, MonthWindow } from "../helpers/months";
import type { Currency, Domain } from "../../../types";

interface Props {
  domain: Domain;
  window: MonthWindow;
  /** What landed in the selected month, converted. */
  realized: number;
  /** realized + still planned for the month in progress; realized otherwise. */
  expected: number;
  /** The selected month against the one before it. */
  delta: MonthDelta;
  /** Label of the previous month ("August 2026"), when there is one. */
  previousLabel: string | null;
  currency: Currency;
  approximate?: boolean;
  /** Investments / savings / debts: the part of the figure that is money in (or repaid). */
  contributed?: number;
  /**
   * Investments / savings: what the month's value checks reported; negative
   * is a loss. Debts: negative is the interest the balance checks revealed.
   */
  gain?: number;
  /** Account domains: what left the accounts this month, as a positive figure. */
  withdrawn?: number;
  /** Account domains: the Month / Total switch, top right. */
  toolbar?: ReactNode;
}

/**
 * The month's verdict in two panels, plan first: what the month is expected
 * to total (landed plus what the plan still owes) and how much of it has
 * landed, then the actual figure so far against last month.
 */
export function MonthSummary({
  domain,
  window,
  realized,
  expected,
  delta,
  previousLabel,
  currency,
  approximate,
  contributed,
  gain,
  withdrawn = 0,
  toolbar,
}: Props) {
  const { formatAmount } = useMoneyFormat();
  const t = useT(DOMAIN_MESSAGES);
  const config = DOMAIN_CONFIG[domain];
  // A net-negative month (withdrawals) has landed nothing of the plan.
  const ratio = expected > 0 ? Math.max(0, realized) / expected : 0;
  const left = Math.max(0, expected - realized);
  // Investments and savings fold a market gain into the figure — and a debt
  // the interest it accrued — so it says what it is made of. Silent when no
  // check landed: the month then reads exactly like one on the other domains.
  const hasGain = gain !== undefined && gain !== 0;
  const showBreakdown = contributed !== undefined && (hasGain || withdrawn > 0);
  const owes = domain === "DEBT";
  const gainKey = owes
    ? (gain ?? 0) < 0
      ? "summary.interestCharges"
      : "summary.reduced"
    : (gain ?? 0) >= 0
      ? "summary.gain"
      : "summary.loss";
  // `contributed` is net of withdrawals; the line spells out both sides.
  const breakdown = [
    t(owes ? "summary.repaid" : "summary.contributed", {
      amount: formatAmount((contributed ?? 0) + withdrawn, currency),
    }),
    withdrawn > 0
      ? t(owes ? "summary.borrowed" : "summary.withdrawn", {
          amount: formatAmount(withdrawn, currency),
        })
      : null,
    hasGain ? t(gainKey, { amount: formatAmount(Math.abs(gain!), currency) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const [beforePct, afterPct] = splitSlot(t(`summary.progress.${domain}`, { pct: SLOT }));

  return (
    <Card>
      {toolbar && <div className="toolbar">{toolbar}</div>}
      <div className="summary">
        <div className="panel plan">
          <span className="label">
            {window.isCurrent ? t("summary.expected") : t("summary.monthTotal")}
          </span>
          <span className="figure">
            <Amount value={expected} currency={currency} size="lg" approximate={approximate} />
          </span>
          <div className="bar">
            <ProgressBar
              ratio={ratio}
              color={config.accent}
              label={t(`summary.ofExpected.${domain}`)}
            />
            <span className="bar-text">
              <span>
                {beforePct}
                <span className="pct">{Math.round(Math.min(1, ratio) * 100)}%</span>
                {afterPct}
              </span>
              <span className="left">
                {window.isCurrent
                  ? left > 0
                    ? t("summary.stillToCome", { amount: formatAmount(left, currency) })
                    : t("summary.nothingMore")
                  : t("summary.closed")}
              </span>
            </span>
          </div>
        </div>

        <div className="panel actual">
          <span className="label">
            {window.isCurrent ? t(`summary.soFar.${domain}`) : t(`summary.total.${domain}`)}
          </span>
          <span className="figure">
            <Amount value={realized} currency={currency} size="md" approximate={approximate} />
            {delta.deltaPct !== null && (
              <DeltaPill pct={delta.deltaPct} upIsGood={config.upIsGood} />
            )}
          </span>
          {showBreakdown && <span className="line breakdown">{breakdown}</span>}
          <span className="line">
            {delta.previousKey && previousLabel
              ? t("summary.comparedTo", {
                  amount: formatAmount(delta.previous, currency),
                  month: previousLabel,
                })
              : t("summary.noPrevious")}
          </span>
        </div>
      </div>

      <style jsx>{`
        .toolbar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 12px;
        }

        .summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .actual {
          padding-left: 24px;
          border-left: 1px solid var(--line);
        }

        .label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--fg-2);
        }

        .figure {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .line {
          font-size: 0.82rem;
          color: var(--fg-1);
        }

        .breakdown {
          font-size: 0.78rem;
          color: var(--fg-2);
        }

        .bar {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bar-text {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--fg-1);
        }

        .pct {
          font-weight: 600;
          color: var(--fg-0);
        }

        @media (max-width: 767px) {
          .summary {
            grid-template-columns: 1fr;
          }

          .actual {
            padding-left: 0;
            padding-top: 16px;
            border-left: none;
            border-top: 1px solid var(--line);
          }
        }
      `}</style>
    </Card>
  );
}
