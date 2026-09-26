import type { ComponentType, ReactNode } from "react";
import { Card } from "../../../components/atoms/Card";
import { Badge } from "../../../components/atoms/Badge";
import type { BadgeTone } from "../../../components/atoms/Badge";
import type { IconProps } from "../../../components/atoms/Icons";
import { IconDisc } from "../../../components/molecules/IconDisc";
import type { Domain } from "../../../types";

export interface SummaryStat {
  key: string;
  label: string;
  domain: Domain;
  Icon: ComponentType<IconProps>;
  /** Already formatted: an amount, or "—" when unknown. */
  value: string;
}

interface Props {
  /** The kind of number ("Monthly plan", "Net worth"). */
  title: string;
  badge: { label: string; tone: BadgeTone };
  /** The headline figure (an Amount, or a Skeleton while loading); absent in an empty state. */
  figure?: ReactNode;
  /** One line under the figure — or, with no figure, the empty-state copy. */
  sub?: string;
  /** What the figure is made of; no inset panel when empty. */
  stats?: SummaryStat[];
  /** Under the stats, inside the same panel (the allocation bar). */
  footer?: ReactNode;
  /** A caveat under the stats, in small print. */
  note?: string;
}

/**
 * The dashboard's hero shape, shared by the monthly plan and net worth so the
 * two read as the same kind of card: a titled figure on the left, what it is
 * made of on the right. The left column has the same width in both, so the
 * two figures line up.
 */
export function SummaryCard({ title, badge, figure, sub, stats = [], footer, note }: Props) {
  return (
    <Card>
      <div className="summary">
        <div className="figure">
          <span className="head">
            <span className="title">{title}</span>
            <Badge tone={badge.tone} caps>
              {badge.label}
            </Badge>
          </span>
          {figure}
          {sub && <span className="sub">{sub}</span>}
        </div>

        {stats.length > 0 && (
          <div className="stats">
            <ul
              className="grid"
              style={{ "--cols": stats.length } as React.CSSProperties}
              aria-label={`${title} breakdown`}
            >
              {stats.map(({ key, label, domain, Icon, value }) => (
                <li key={key} className="stat">
                  <IconDisc domain={domain} size={30}>
                    <Icon size={14} />
                  </IconDisc>
                  <span className="stat-text">
                    <span className="stat-amount">{value}</span>
                    <span className="stat-label">{label}</span>
                  </span>
                </li>
              ))}
            </ul>
            {footer}
            {note && <span className="note">{note}</span>}
          </div>
        )}
      </div>

      <style jsx>{`
        .summary {
          display: grid;
          grid-template-columns: minmax(200px, 0.8fr) minmax(0, 2.2fr);
          gap: 28px;
          align-items: center;
        }

        .figure {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
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

        .note {
          font-size: 0.75rem;
          color: var(--fg-2);
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
          grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
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

        @media (max-width: 1100px) {
          .summary {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
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
