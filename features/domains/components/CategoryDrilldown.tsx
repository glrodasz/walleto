import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Chip } from "../../../components/atoms/Chip";
import { PeriodTransactionsList } from "./PeriodTransactionsList";
import { categoryIdSet } from "./CategoryMonthList";
import type { MoneyContext } from "../../../helpers/aggregations";
import type { Category, Currency, Transaction } from "../../../types";

interface Props {
  category: Category;
  categories: Category[];
  /** The selected month's transactions, all categories. */
  transactions: Transaction[];
  currency: Currency;
  ctx: MoneyContext;
  monthLabel: string;
  loading?: boolean;
  onBack: () => void;
  onDelete: (transactionId: string) => void;
  deletingId: string | null;
  /** Domain-specific panels for this category (subscription insights, valuations). */
  extras?: ReactNode;
}

/**
 * One category for the month: subcategory chips when it has children, the
 * matching transactions, and whatever the domain wants to say about it.
 */
export function CategoryDrilldown({
  category,
  categories,
  transactions,
  currency,
  ctx,
  monthLabel,
  loading,
  onBack,
  onDelete,
  deletingId,
  extras,
}: Props) {
  const children = useMemo(
    () => categories.filter((c) => c.parentId === category.id),
    [categories, category.id]
  );
  const [subId, setSubId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const ids = subId ? new Set([subId]) : categoryIdSet(category, categories);
    return transactions.filter((t) => ids.has(t.categoryId));
  }, [transactions, category, categories, subId]);

  return (
    <div className="drill">
      <button type="button" className="back" onClick={onBack}>
        ‹ All categories
      </button>

      {children.length > 0 && (
        <div className="chips" role="group" aria-label="Subcategory">
          <Chip selected={subId === null} onClick={() => setSubId(null)}>
            All
          </Chip>
          {children.map((c) => (
            <Chip key={c.id} selected={subId === c.id} onClick={() => setSubId(c.id ?? null)}>
              {c.name}
            </Chip>
          ))}
        </div>
      )}

      <PeriodTransactionsList
        title={`${category.name} · ${monthLabel}`}
        transactions={rows}
        displayCurrency={currency}
        ctx={ctx}
        loading={loading}
        onDelete={onDelete}
        deletingId={deletingId}
      />

      {extras}

      <style jsx>{`
        .drill {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .back {
          align-self: flex-start;
          border: none;
          background: transparent;
          color: var(--fg-1);
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 6px 0;
          cursor: pointer;
        }

        .back:hover {
          color: var(--fg-0);
        }

        .chips {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }

        .chips::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
