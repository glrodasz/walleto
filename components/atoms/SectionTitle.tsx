import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  title: string;
  /** One line under the title saying what the numbers are. */
  subtitle?: string;
  /** "View all" as a link… */
  href?: string;
  /** …or as a button, when it changes something on the same page. */
  onAction?: () => void;
  actionLabel?: string;
  /** Anything else at the right edge (a select, a segmented control). */
  children?: ReactNode;
}

export function SectionTitle({
  title,
  subtitle,
  href,
  onAction,
  actionLabel = "View all",
  children,
}: Props) {
  return (
    <div className="header">
      <div className="text">
        <h2 className="title">{title}</h2>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      <div className="right">
        {children}
        {href && (
          <Link href={href} className="action">
            {actionLabel}
          </Link>
        )}
        {!href && onAction && (
          <button type="button" className="action" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
      <style jsx>{`
        .header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--fg-0);
        }

        .subtitle {
          margin: 0;
          font-size: 0.8rem;
          color: var(--fg-2);
        }

        .right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .right :global(.action) {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 0 12px;
          border: 1px solid var(--line);
          border-radius: var(--r-md);
          background: var(--bg-1);
          color: var(--fg-1);
          font-family: inherit;
          font-size: 0.78rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition:
            color 0.15s,
            border-color 0.15s;
        }

        .right :global(.action:hover) {
          color: var(--fg-0);
          border-color: var(--line-strong);
        }
      `}</style>
    </div>
  );
}
