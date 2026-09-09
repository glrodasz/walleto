import { Card } from "../../../components/atoms/Card";
import { Amount, formatAmount } from "../../../components/atoms/Amount";
import type { Currency } from "../../../types";
import type { MoneyFlow } from "../../../helpers";

interface Props {
  flow: MoneyFlow;
  currency: Currency;
  /** Aggregates converted with real FX rates get the "≈" marker. */
  approximate?: boolean;
}

/**
 * The hero figure: monthly net = income − expenses − savings − investments
 * (the owner's definition — cash left unallocated). Savings and investments
 * are money that stays yours, so they get their own allocation line instead
 * of being lumped in with spending. Every number here is the recurring
 * run-rate — what the plan does each month — and the card says so.
 */
export function NetFlowCard({ flow, currency, approximate = false }: Props) {
  return (
    <Card>
      <span className="head">
        <span className="title">Net this month</span>
        <span className="tag">Recurring</span>
      </span>
      <Amount value={flow.net} currency={currency} size="lg" colorize approximate={approximate} />
      <span className="equation">
        {formatAmount(flow.income, currency)} in − {formatAmount(flow.expenses, currency)} out
      </span>
      <span className="allocation">
        → savings {formatAmount(flow.savings, currency)}
        <span className="sep"> · </span>
        investments {formatAmount(flow.investments, currency)}
      </span>
      <span className="note">
        Your recurring plan per month. One-off payments show in Cash flow and Recent payments.
      </span>
      <style jsx>{`
        .head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .tag {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 1px 6px;
          border-radius: 999px;
          border: 1px solid var(--line-strong);
          color: var(--fg-2);
          white-space: nowrap;
        }

        .note {
          margin-top: 4px;
          font-size: 0.72rem;
          color: var(--fg-2);
        }

        .title {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--fg-2);
        }

        .equation {
          font-size: 0.8rem;
          color: var(--fg-1);
        }

        .allocation {
          font-size: 0.78rem;
          color: var(--fg-2);
        }

        .sep {
          color: var(--line-strong);
        }
      `}</style>
    </Card>
  );
}
