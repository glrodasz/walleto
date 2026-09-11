import { Card } from "../../../components/atoms/Card";
import { Amount, formatAmount } from "../../../components/atoms/Amount";
import { formatList } from "../../../utils/formatList";
import type { Currency } from "../../../types";
import type { WhatIfImpact } from "../helpers/whatIfImpact";

interface Props {
  impact: WhatIfImpact;
  currentNet: number;
  currency: Currency;
}

/** "Cancelling Netflix, iCloud frees ≈ $36/mo · $432/yr; your net becomes $X" — the mockup's payoff line. */
export function WhatIfSummary({ impact, currentNet, currency }: Props) {
  const adjustedNet = currentNet + impact.freedMonthly;
  const hasSelection = impact.excludedNames.length > 0;

  return (
    <Card accentColor="var(--accent)">
      {hasSelection ? (
        <p className="sentence">
          Cancelling <strong>{formatList(impact.excludedNames)}</strong> frees ≈{" "}
          <strong>{formatAmount(impact.freedMonthly, currency)}/mo</strong> ·{" "}
          {formatAmount(impact.freedAnnual, currency)}/yr.
        </p>
      ) : (
        <p className="sentence">Check items on the left to simulate cancelling them.</p>
      )}

      <div className="nets">
        <div>
          <span className="label">Net today</span>
          <Amount value={currentNet} currency={currency} size="md" colorize />
        </div>
        <span className="arrow">→</span>
        <div>
          <span className="label">Net if cancelled</span>
          <Amount value={adjustedNet} currency={currency} size="md" colorize />
        </div>
      </div>

      <style jsx>{`
        .sentence {
          margin: 0 0 16px;
          font-size: 0.95rem;
          color: var(--fg-1);
          line-height: 1.5;
        }

        .sentence strong {
          color: var(--fg-0);
        }

        .nets {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .label {
          display: block;
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--fg-2);
          margin-bottom: 4px;
        }

        .arrow {
          color: var(--fg-2);
          font-size: 1.2rem;
        }
      `}</style>
    </Card>
  );
}
