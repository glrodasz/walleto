import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { formatAmount } from "../../../components/atoms/Amount";
import { toMonthlyAmount } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import type { Currency, Domain, RecurrentTransaction } from "../../../types";

interface Props {
  items: RecurrentTransaction[];
  excludedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  ctx: MoneyContext;
  currency: Currency;
  loading: boolean;
}

const DOMAIN_LABEL: Record<Domain, string> = {
  EXPENSE: "Expense",
  INVESTMENT: "Investment",
  SAVING: "Saving",
  INCOME: "Income",
};

/** Checkbox per active EXPENSE/INVESTMENT/SAVING item — checked means "simulate cancelling this". */
export function CancelableItemsList({
  items,
  excludedIds,
  onToggle,
  ctx,
  currency,
  loading,
}: Props) {
  return (
    <Card>
      <SectionTitle title="What could you cancel?" />
      <p className="hint">
        Check anything you&rsquo;re considering cancelling to see how it changes your monthly net.
      </p>

      {loading ? (
        <p className="empty">Loading…</p>
      ) : items.length === 0 ? (
        <p className="empty">No recurring expenses, investments or savings yet.</p>
      ) : (
        <ul className="list">
          {items.map((item) => {
            const checked = Boolean(item.id && excludedIds.has(item.id));
            return (
              <li key={item.id} className="row">
                <label className="option">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => item.id && onToggle(item.id)}
                  />
                  <span className="name">{item.name}</span>
                  <span className="domain-tag">{DOMAIN_LABEL[item.domain]}</span>
                </label>
                <span className="amount">
                  {formatAmount(toMonthlyAmount(item, ctx), currency)}/mo
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <style jsx>{`
        .hint {
          margin: 0 0 16px;
          font-size: 0.85rem;
          color: var(--fg-1);
        }

        .empty {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 420px;
          overflow-y: auto;
        }

        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .option {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          cursor: pointer;
        }

        .option input {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          accent-color: var(--accent);
          cursor: pointer;
        }

        .name {
          font-size: 0.85rem;
          color: var(--fg-1);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .domain-tag {
          flex-shrink: 0;
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--fg-2);
          background: var(--bg-2);
          border-radius: 999px;
          padding: 2px 8px;
        }

        .amount {
          flex-shrink: 0;
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--fg-0);
          white-space: nowrap;
        }
      `}</style>
    </Card>
  );
}
