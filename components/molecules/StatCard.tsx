import type { Currency, Domain } from "../../types";
import { Card } from "../atoms/Card";
import { Amount, formatAmount } from "../atoms/Amount";

interface SummaryEntry {
  name: string;
  amount: number;
}

interface Props {
  title: string;
  amount: number;
  currency: Currency;
  domain: Domain;
  delta?: number;
  summary?: SummaryEntry[];
  /** Share per currency in use; shown only when more than one is in play. */
  byCurrency?: { currency: Currency; pct: number }[];
  /** Small label at the top right, e.g. "Recurring" — what kind of number this is. */
  tag?: string;
}

const DOMAIN_ACCENT: Record<Domain, string> = {
  INCOME: "var(--domain-income)",
  EXPENSE: "var(--domain-expense)",
  INVESTMENT: "var(--domain-investment)",
  SAVING: "var(--domain-saving)",
};

export function StatCard({
  title,
  amount,
  currency,
  domain,
  delta,
  summary,
  byCurrency,
  tag,
}: Props) {
  const hasDelta = delta !== undefined && delta !== 0;
  const deltaPositive = (delta ?? 0) > 0;
  // Sentiment is domain-aware: spending less is good, earning less is not.
  const deltaGood = domain === "EXPENSE" ? !deltaPositive : deltaPositive;

  return (
    <Card accentColor={DOMAIN_ACCENT[domain]}>
      <span className="head">
        <span className="title">{title}</span>
        {tag && <span className="tag">{tag}</span>}
      </span>
      <Amount value={amount} currency={currency} size="lg" />
      {summary && summary.length > 0 && (
        <span className="summary">
          {summary.map((s, i) => (
            <span key={s.name}>
              {i > 0 && <span className="sep"> · </span>}
              {s.name}: {formatAmount(s.amount, currency)}
            </span>
          ))}
        </span>
      )}
      {byCurrency && byCurrency.length > 1 && (
        <span className="currencies" aria-label="By currency">
          {byCurrency.map((c, i) => (
            <span key={c.currency}>
              {i > 0 && <span className="sep"> · </span>}
              {c.currency} {c.pct.toFixed(0)}%
            </span>
          ))}
        </span>
      )}
      {hasDelta && (
        <span className={`delta ${deltaGood ? "good" : "bad"}`}>
          {deltaPositive ? "▲" : "▼"} {Math.abs(delta ?? 0).toFixed(1)}%{" "}
          {deltaPositive ? "more" : "less"} than last month to date
        </span>
      )}
      <style jsx>{`
        .head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .title {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--fg-2);
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

        .summary {
          font-size: 0.78rem;
          color: var(--fg-2);
          line-height: 1.5;
        }

        .sep {
          color: var(--line-strong);
        }

        .currencies {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: var(--fg-2);
        }

        .delta {
          font-size: 0.78rem;
          margin-top: 2px;
        }

        .good {
          color: var(--accent);
        }

        .bad {
          color: var(--accent-hot);
        }
      `}</style>
    </Card>
  );
}
