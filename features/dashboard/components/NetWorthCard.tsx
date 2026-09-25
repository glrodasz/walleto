import { Card } from "../../../components/atoms/Card";
import { Badge } from "../../../components/atoms/Badge";
import { Amount } from "../../../components/atoms/Amount";
import Skeleton from "../../../components/Skeleton";
import { Circle, CreditCard, TrendingUp } from "../../../components/atoms/Icons";
import { IconDisc } from "../../../components/molecules/IconDisc";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useDateFormat } from "../../../hooks/usePreferences";
import type { NetWorth } from "../helpers/netWorth";
import type { Currency, Domain } from "../../../types";

interface Props {
  worth: NetWorth;
  currency: Currency;
  loading?: boolean;
  /** Aggregates converted with real FX rates get the "≈" marker. */
  approximate?: boolean;
}

/**
 * Where the owner stands today: investments and savings minus what the debts
 * still owe. The hero above is the plan (a monthly run-rate); this is a
 * position (a balance), so it says "Today" and never shares a figure with it.
 */
export function NetWorthCard({ worth, currency, loading = false, approximate = false }: Props) {
  const { formatAmount } = useMoneyFormat();
  const { formatDate } = useDateFormat();

  const parts: { key: string; label: string; domain: Domain; Icon: typeof Circle; text: string }[] =
    [
      {
        key: "investments",
        label: "Investments",
        domain: "INVESTMENT",
        Icon: TrendingUp,
        text: formatAmount(worth.investments, currency),
      },
      {
        key: "savings",
        label: "Savings",
        domain: "SAVING",
        Icon: Circle,
        text: formatAmount(worth.savings, currency),
      },
      {
        key: "debts",
        label: "Owed on debts",
        domain: "DEBT",
        Icon: CreditCard,
        text: worth.debtsUnknown ? "—" : formatAmount(worth.debts, currency),
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
    <Card>
      <div className="worth">
        <div className="net">
          <span className="head">
            <span className="title">Net worth</span>
            <Badge tone="info" caps>
              Today
            </Badge>
          </span>
          {loading ? (
            <Skeleton.Box width={180} height={36} />
          ) : worth.empty ? (
            <span className="empty">
              Add your investment accounts, savings pockets and debts, then update what each is
              worth from the + button to see where you stand.
            </span>
          ) : (
            <>
              <Amount
                value={worth.net}
                currency={currency}
                size="lg"
                colorize
                approximate={approximate}
              />
              <span className="sub">{sub}</span>
            </>
          )}
        </div>

        {!loading && !worth.empty && (
          <div className="stats">
            <ul className="grid">
              {parts.map(({ key, label, domain, Icon, text }) => (
                <li key={key} className="stat">
                  <IconDisc domain={domain} size={30}>
                    <Icon size={14} />
                  </IconDisc>
                  <span className="stat-text">
                    <span className="stat-amount">{text}</span>
                    <span className="stat-label">{label}</span>
                  </span>
                </li>
              ))}
            </ul>
            {worth.debtsUnknown && (
              <span className="note">
                A debt has no recorded balance yet, so it isn&apos;t counted. Update its balance to
                include it.
              </span>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .worth {
          display: grid;
          grid-template-columns: minmax(200px, 1fr) minmax(0, 2fr);
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

        .sub,
        .empty {
          font-size: 0.85rem;
          color: var(--fg-1);
        }

        .stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
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
          grid-template-columns: repeat(3, 1fr);
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

        .note {
          font-size: 0.75rem;
          color: var(--fg-2);
        }

        @media (max-width: 1100px) {
          .worth {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .grid {
            grid-template-columns: 1fr;
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
