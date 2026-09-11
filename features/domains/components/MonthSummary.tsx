import { Card } from "../../../components/atoms/Card";
import { Amount, formatAmount } from "../../../components/atoms/Amount";
import { DeltaPill } from "../../../components/molecules/DeltaPill";
import { ProgressBar } from "../../../components/molecules/ProgressBar";
import { DOMAIN_CONFIG } from "../helpers/domainConfig";
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
}

/**
 * The month's verdict in two panels: the total so far against last month,
 * and the plan — how much of what is expected has landed, and what is left.
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
}: Props) {
  const config = DOMAIN_CONFIG[domain];
  const ratio = expected > 0 ? realized / expected : 0;
  const left = Math.max(0, expected - realized);

  return (
    <Card>
      <div className="summary">
        <div className="panel">
          <span className="label">
            Total {config.spentLabel.toLowerCase()}
            {window.isCurrent ? " so far" : ""}
          </span>
          <span className="figure">
            <Amount value={realized} currency={currency} size="lg" approximate={approximate} />
            {delta.deltaPct !== null && (
              <DeltaPill pct={delta.deltaPct} upIsGood={config.upIsGood} />
            )}
          </span>
          <span className="line">
            {delta.previousKey && previousLabel
              ? `Compared to ${formatAmount(delta.previous, currency)} in ${previousLabel}`
              : "No previous month to compare with"}
          </span>
        </div>

        <div className="panel planned">
          <span className="label">Planned</span>
          <span className="figure">
            <Amount value={expected} currency={currency} size="md" approximate={approximate} />
          </span>
          <div className="bar">
            <ProgressBar
              ratio={ratio}
              color={config.accent}
              label={`${config.spentLabel} of planned`}
            />
            <span className="bar-text">
              <span className="pct">{Math.round(Math.min(1, ratio) * 100)}%</span>
              <span className="left">
                {window.isCurrent
                  ? left > 0
                    ? `${formatAmount(left, currency)} left`
                    : "Nothing more planned"
                  : "Month total"}
              </span>
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
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

        .planned {
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

          .planned {
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
