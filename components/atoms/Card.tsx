import type { ReactNode } from "react";
import type { Domain } from "../../types";

interface Props {
  children: ReactNode;
  /** Soft domain wash behind the card (the dashboard's domain cards). */
  tint?: Domain;
  padding?: "sm" | "md";
  /** Extra class for a parent's :global() rules. */
  className?: string;
  /** @deprecated The glass card carries no accent edge; kept so callers migrate gradually. */
  accentColor?: string;
}

const TINT: Record<Domain, string> = {
  INCOME: "var(--domain-income-soft)",
  EXPENSE: "var(--domain-expense-soft)",
  INVESTMENT: "var(--domain-investment-soft)",
  SAVING: "var(--domain-saving-soft)",
};

/** A frosted surface over the backdrop. Everything on a page sits in one. */
export function Card({ children, tint, padding = "md", className }: Props) {
  return (
    <div
      className={`card card--${padding}${className ? ` ${className}` : ""}`}
      style={tint ? { background: TINT[tint] } : undefined}
    >
      {children}
      <style jsx>{`
        .card {
          background: var(--glass);
          backdrop-filter: blur(var(--glass-blur)) saturate(1.3);
          -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.3);
          border: 1px solid var(--line);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }

        .card--md {
          padding: 24px;
        }

        .card--sm {
          padding: 16px;
        }

        @media (max-width: 767px) {
          .card--md {
            padding: 18px;
          }
        }
      `}</style>
    </div>
  );
}
