import { Card } from "../../../components/atoms/Card";
import { Badge } from "../../../components/atoms/Badge";
import { Amount, formatAmount } from "../../../components/atoms/Amount";
import { ArrowDown, ArrowUpRight, Circle, TrendingUp } from "../../../components/atoms/Icons";
import { IconDisc } from "../../../components/molecules/IconDisc";
import { AllocationBar } from "./AllocationBar";
import type { Currency, Domain } from "../../../types";
import type { MoneyFlow } from "../../../helpers";

interface Props {
  flow: MoneyFlow;
  currency: Currency;
  /** Aggregates converted with real FX rates get the "≈" marker. */
  approximate?: boolean;
}

const QUOTE = "A clear plan today, a more free tomorrow.";

const STATS: { key: keyof MoneyFlow; label: string; domain: Domain; Icon: typeof ArrowUpRight }[] =
  [
    { key: "income", label: "Income", domain: "INCOME", Icon: ArrowUpRight },
    { key: "expenses", label: "Expenses", domain: "EXPENSE", Icon: ArrowDown },
    { key: "investments", label: "Investments", domain: "INVESTMENT", Icon: TrendingUp },
    { key: "savings", label: "Savings", domain: "SAVING", Icon: Circle },
  ];

/**
 * The hero figure: monthly net = income − expenses − savings − investments
 * (the owner's definition — cash left unallocated). Savings and investments
 * are money that stays yours, so they get their own slice of the allocation
 * bar instead of being lumped in with spending. Every number here is the
 * recurring run-rate — what the plan does each month — and the card says so.
 */
export function NetFlowCard({ flow, currency, approximate = false }: Props) {
  return (
    <Card>
      <div className="hero">
        <div className="net">
          <span className="head">
            <span className="title">Monthly plan</span>
            <Badge tone="success" caps>
              Recurring
            </Badge>
          </span>
          <Amount
            value={flow.net}
            currency={currency}
            size="lg"
            colorize
            approximate={approximate}
          />
          <span className="sub">left to allocate this month</span>
        </div>

        <div className="stats">
          <ul className="grid">
            {STATS.map(({ key, label, domain, Icon }) => (
              <li key={key} className="stat">
                <IconDisc domain={domain} size={30}>
                  <Icon size={14} />
                </IconDisc>
                <span className="stat-text">
                  <span className="stat-amount">{formatAmount(flow[key], currency)}</span>
                  <span className="stat-label">{label}</span>
                </span>
              </li>
            ))}
          </ul>
          <AllocationBar flow={flow} />
        </div>

        <blockquote className="quote">
          <p>“{QUOTE}”</p>
        </blockquote>
      </div>

      <style jsx>{`
        .hero {
          display: grid;
          grid-template-columns: minmax(200px, 1fr) minmax(0, 2fr) minmax(160px, 0.8fr);
          gap: 28px;
          align-items: center;
        }

        .net {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .head {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .title {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--fg-2);
        }

        .sub {
          font-size: 0.85rem;
          color: var(--fg-1);
        }

        .stats {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 16px 18px;
          border-radius: var(--r-lg);
          background: var(--glass-inset);
          border: 1px solid var(--glass-rim);
        }

        .grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .stat + .stat {
          border-left: 1px solid var(--line);
          padding-left: 12px;
        }

        .stat-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .stat-amount {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--fg-0);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stat-label {
          font-size: 0.72rem;
          color: var(--fg-2);
        }

        .quote {
          margin: 0;
          padding-left: 20px;
          border-left: 2px solid var(--line);
          font-family: var(--font-serif, Georgia, serif);
          font-style: italic;
          font-size: 1.05rem;
          line-height: 1.4;
          color: var(--fg-1);
        }

        .quote p {
          margin: 0;
        }

        @media (max-width: 1100px) {
          .hero {
            grid-template-columns: 1fr;
          }

          .quote {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .stat + .stat {
            border-left: none;
            padding-left: 0;
          }
        }
      `}</style>
    </Card>
  );
}
