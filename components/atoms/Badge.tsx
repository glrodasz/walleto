import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

interface Props {
  children: ReactNode;
  /** Solid: tinted pill ("RECURRING", "Paid"). Outline: hairline pill (user tags, "Hidden"). */
  variant?: "solid" | "outline";
  tone?: BadgeTone;
  /** Uppercase small caps, for labels that name a kind of number. */
  caps?: boolean;
  /** Any colour instead of a tone (a domain accent). */
  color?: string;
}

const TONE: Record<BadgeTone, string> = {
  neutral: "var(--fg-2)",
  success: "var(--domain-income)",
  warning: "var(--accent-amber)",
  danger: "var(--accent-hot)",
  info: "var(--accent)",
};

/**
 * Two vocabularies that must stay distinguishable: solid pills are states
 * the app applied (status, kind of number); outline pills are the user's own
 * labels.
 */
export function Badge({ children, variant = "solid", tone = "neutral", caps, color }: Props) {
  return (
    <span
      className={`badge badge--${variant}${caps ? " badge--caps" : ""}`}
      style={{ "--badge-color": color ?? TONE[tone] } as React.CSSProperties}
    >
      {children}
      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 600;
          line-height: 1;
          padding: 4px 8px;
          border-radius: 999px;
          white-space: nowrap;
          flex-shrink: 0;
          color: var(--badge-color);
        }

        .badge--solid {
          background: color-mix(in srgb, var(--badge-color) 14%, transparent);
        }

        .badge--outline {
          border: 1px solid color-mix(in srgb, var(--badge-color) 55%, transparent);
        }

        .badge--caps {
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
      `}</style>
    </span>
  );
}
