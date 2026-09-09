import type { ReactNode } from "react";
import type { Currency } from "../../types";
import { formatNative } from "../atoms/Amount";

interface Props {
  name: string;
  amount: number;
  /** The row's own currency — rows always show what was actually charged. */
  currency: Currency;
  /** The reporting currency, so a foreign row can be written with its ISO code. */
  displayCurrency: Currency;
  meta: string;
  /** Small pills after the name ("Hidden on dashboard"). */
  tags?: string[];
  /** Dim the whole row — for entries that are hidden somewhere. */
  muted?: boolean;
  /** Optional trailing slot — a kebab menu, for rows that support actions. */
  trailing?: ReactNode;
}

export function TransactionRow({
  name,
  amount,
  currency,
  displayCurrency,
  meta,
  tags,
  muted,
  trailing,
}: Props) {
  return (
    <li className={`row${muted ? " muted" : ""}`}>
      <span className="main">
        <span className="name">{name}</span>
        {tags && tags.length > 0 && (
          <span className="tags">
            {tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="right">
        <span className="amount">{formatNative(amount, currency, displayCurrency)}</span>
        <span className="meta">{meta}</span>
      </span>
      {trailing}
      <style jsx>{`
        /* Name takes the slack and truncates; amounts sit in one right-aligned
           column whatever the name's length; the trailing slot hugs the edge. */
        .row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .row.muted {
          opacity: 0.55;
        }

        .main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .name {
          font-size: 0.85rem;
          color: var(--fg-1);
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .tag {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 1px 6px;
          border-radius: 999px;
          border: 1px solid var(--accent-amber);
          color: var(--accent-amber);
        }

        .right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex-shrink: 0;
          gap: 1px;
        }

        .amount {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--fg-0);
        }

        .meta {
          font-size: 0.72rem;
          color: var(--fg-2);
        }
      `}</style>
    </li>
  );
}
