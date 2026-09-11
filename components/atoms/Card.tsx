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

/** A pane of glass over the backdrop. Everything on a page sits in one. */
export function Card({ children, tint, padding = "md", className }: Props) {
  return (
    <div
      className={`glass card card--${padding}${className ? ` ${className}` : ""}`}
      style={tint ? ({ "--card-tint": TINT[tint] } as React.CSSProperties) : undefined}
    >
      {children}
      <style jsx>{`
        /* Fill, blur, rim and sheen come from .glass in globals.css. The tint
           is an extra wash *between* the sheen and the fill, so a domain card
           is still glass with a colour behind it — never a flat colour tile. */
        .card {
          border-radius: var(--r-xl);
          background-image:
            var(--glass-sheen),
            linear-gradient(var(--card-tint, transparent), var(--card-tint, transparent));
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
