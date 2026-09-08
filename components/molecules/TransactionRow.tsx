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
  /** Optional trailing slot — a kebab menu, for rows that support actions. */
  trailing?: ReactNode;
}

export function TransactionRow({ name, amount, currency, displayCurrency, meta, trailing }: Props) {
  return (
    <li className="row">
      <span className="name">{name}</span>
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

        .name {
          flex: 1;
          font-size: 0.85rem;
          color: var(--fg-1);
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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
