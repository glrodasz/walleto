import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { Amount, formatAmount } from "../../../components/atoms/Amount";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { sumMonthly } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { subscriptionCosts } from "../helpers/subscriptionCosts";
import type { Category, Currency, RecurrentTransaction } from "../../../types";
import { useDateFormat } from "../../../hooks/usePreferences";

interface Props {
  /** All of the domain's active recurrent items — the predicate does its own filtering. */
  items: RecurrentTransaction[];
  categories: Category[];
  ctx: MoneyContext;
  currency: Currency;
}

/**
 * The mockup calls out subscriptions as a primary surface: what they cost
 * monthly and per year, what share of income they eat, and — when a charged
 * pair is on file — the exchange rate that pair implies, so a card billed
 * abroad shows the rate actually paid rather than today's market rate.
 */
export function SubscriptionInsights({ items, categories, ctx, currency }: Props) {
  const { formatDate } = useDateFormat();
  // Only mounted on the Subscriptions tab, so this listener is scoped to when
  // it's actually needed rather than always running on every expenses visit.
  const { items: incomeItems } = useRecurrentTransactions("INCOME");
  const incomeMonthly = sumMonthly(incomeItems, ctx);

  const summary = subscriptionCosts(items, categories, ctx, incomeMonthly);

  if (summary.items.length === 0) {
    return null;
  }

  return (
    <Card accentColor="var(--domain-expense)">
      <SectionTitle title="Subscription costs" />

      <div className="totals">
        <div>
          <span className="label">Monthly</span>
          <Amount value={summary.totalMonthly} currency={currency} size="md" />
        </div>
        <div>
          <span className="label">Annualized</span>
          <Amount value={summary.totalAnnualized} currency={currency} size="md" />
        </div>
        {summary.percentOfIncome !== null && (
          <div>
            <span className="label">Of income</span>
            <span className="percent">{summary.percentOfIncome.toFixed(1)}%</span>
          </div>
        )}
      </div>

      <ul className="list">
        {summary.items.map((sub) => (
          <li key={sub.id} className="row">
            <span className="name">{sub.name}</span>
            <span className="figures">
              <span className="cost">
                {formatAmount(sub.monthlyAmount, currency)}/mo · ≈{" "}
                {formatAmount(sub.annualizedAmount, currency)}/yr
              </span>
              <span className="meta">
                {sub.nextOccurrence && `Next ${formatDate(sub.nextOccurrence, "day")}`}
                {sub.nextOccurrence && sub.impliedRate !== null && " · "}
                {sub.impliedRate !== null && `≈${sub.impliedRate.toFixed(2)} implied rate`}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <style jsx>{`
        .totals {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          padding-bottom: 16px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--line);
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

        .percent {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--fg-0);
        }

        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }

        .name {
          font-size: 0.85rem;
          color: var(--fg-1);
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .figures {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex-shrink: 0;
          gap: 1px;
        }

        .cost {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--fg-0);
          white-space: nowrap;
        }

        .meta {
          font-size: 0.72rem;
          color: var(--fg-2);
          white-space: nowrap;
        }
      `}</style>
    </Card>
  );
}
