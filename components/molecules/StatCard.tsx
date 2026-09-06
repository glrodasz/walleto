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
}

const DOMAIN_ACCENT: Record<Domain, string> = {
  INCOME: "var(--domain-income)",
  EXPENSE: "var(--domain-expense)",
  INVESTMENT: "var(--domain-investment)",
  SAVING: "var(--domain-saving)",
};

export function StatCard({ title, amount, currency, domain, delta, summary }: Props) {
  const hasDelta = delta !== undefined && delta !== 0;
  const deltaPositive = (delta ?? 0) > 0;
  // Sentiment is domain-aware: spending less is good, earning less is not.
  const deltaGood = domain === "EXPENSE" ? !deltaPositive : deltaPositive;

  return (
    <Card accentColor={DOMAIN_ACCENT[domain]}>
      <span className="title">{title}</span>
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
      {hasDelta && (
        <span className={`delta ${deltaGood ? "good" : "bad"}`}>
          {deltaPositive ? "▲" : "▼"} {Math.abs(delta ?? 0).toFixed(1)}%{" "}
          {deltaPositive ? "more" : "less"} than last month to date
        </span>
      )}
      <style jsx>{`
        .title {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--fg-2);
        }

        .summary {
          font-size: 0.78rem;
          color: var(--fg-2);
          line-height: 1.5;
        }

        .sep {
          color: var(--line-strong);
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
