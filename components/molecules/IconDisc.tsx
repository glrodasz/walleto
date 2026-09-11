import type { ReactNode } from "react";
import type { Domain } from "../../types";

interface Props {
  children: ReactNode;
  /** Tint from a domain accent… */
  domain?: Domain;
  /** …or any colour (the icon takes it, the disc a soft wash of it). */
  color?: string;
  size?: number;
}

const DOMAIN_COLOR: Record<Domain, string> = {
  INCOME: "var(--domain-income)",
  EXPENSE: "var(--domain-expense)",
  INVESTMENT: "var(--domain-investment)",
  SAVING: "var(--domain-saving)",
};

/** The round tinted disc behind an icon on cards and rows. */
export function IconDisc({ children, domain, color, size = 40 }: Props) {
  const tint = color ?? (domain ? DOMAIN_COLOR[domain] : "var(--accent)");
  return (
    <span
      className="disc"
      aria-hidden="true"
      style={{ "--disc-color": tint, "--disc-size": `${size}px` } as React.CSSProperties}
    >
      {children}
      <style jsx>{`
        .disc {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: var(--disc-size);
          height: var(--disc-size);
          border-radius: 50%;
          color: var(--disc-color);
          background: color-mix(in srgb, var(--disc-color) 14%, var(--bg-1));
        }
      `}</style>
    </span>
  );
}
