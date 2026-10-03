import { Badge } from "../../../components/atoms/Badge";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { ListItem, ListItems } from "../../../components/molecules/ListItem";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { FREQUENCY_LABELS } from "../../../constants";
import type { RankedItem } from "../helpers/rankCancelable";
import type { Category, Currency, Domain, RecurrentTransaction } from "../../../types";

interface Props {
  title: string;
  rows: RankedItem[];
  /** Shown when the group is empty; without it an empty group isn't rendered. */
  emptyText?: string;
  isChecked: (id: string) => boolean;
  /** Absent → the checks are read-only (emergency mode decides them). */
  onToggle?: (id: string) => void;
  onMarkEssential: (item: RecurrentTransaction, essential: boolean) => void;
  categories: Pick<Category, "id" | "name">[];
  currency: Currency;
}

const CONTRIBUTION_LABEL: Partial<Record<Domain, string>> = {
  INVESTMENT: "Investment",
  SAVING: "Saving",
};

/** One group of the cancel list: a heading with its monthly total, then a row per item. */
export function CancelableSection({
  title,
  rows,
  emptyText,
  isChecked,
  onToggle,
  onMarkEssential,
  categories,
  currency,
}: Props) {
  const { formatAmount } = useMoneyFormat();
  if (rows.length === 0 && !emptyText) return null;

  const total = rows.reduce((acc, r) => acc + r.monthly, 0);
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name;

  return (
    <section className="group" aria-label={title}>
      <header className="head">
        <h3 className="title">{title}</h3>
        {rows.length > 0 && <span className="total">{formatAmount(total, currency)}/mo</span>}
      </header>

      {rows.length === 0 ? (
        <p className="empty">{emptyText}</p>
      ) : (
        <ListItems>
          {rows.map(({ item, monthly, essential, guessed }) => {
            const id = item.id ?? "";
            const checked = isChecked(id);
            const contribution = CONTRIBUTION_LABEL[item.domain];
            const meta = [FREQUENCY_LABELS[item.frequency], categoryName(item.categoryId)]
              .filter(Boolean)
              .join(" · ");
            const badges =
              guessed || contribution ? (
                <>
                  {contribution && <Badge caps>{contribution}</Badge>}
                  {guessed && (
                    <Badge variant="outline" caps>
                      Guessed
                    </Badge>
                  )}
                </>
              ) : undefined;

            return (
              <ListItem
                key={id || item.name}
                muted={!onToggle && checked}
                leading={
                  <input
                    type="checkbox"
                    className="check"
                    checked={checked}
                    disabled={!onToggle}
                    onChange={() => onToggle?.(id)}
                    aria-label={`${onToggle ? "Simulate cancelling" : "Paused"}: ${item.name}`}
                  />
                }
                name={item.name}
                meta={meta}
                badges={badges}
                amount={`${formatAmount(monthly, currency)}/mo`}
                trailing={
                  item.domain === "EXPENSE" ? (
                    <KebabMenu
                      aria-label={`Actions for ${item.name}`}
                      actions={[
                        essential
                          ? {
                              label: "Mark as non-essential",
                              onSelect: () => onMarkEssential(item, false),
                            }
                          : {
                              label: "Mark as essential",
                              onSelect: () => onMarkEssential(item, true),
                            },
                      ]}
                    />
                  ) : undefined
                }
              />
            );
          })}
        </ListItems>
      )}

      <style jsx>{`
        .group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid var(--line);
        }

        .title {
          margin: 0;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--fg-2);
        }

        .total {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--fg-1);
          white-space: nowrap;
        }

        .empty {
          margin: 10px 0 0;
          font-size: 0.8rem;
          color: var(--fg-2);
          line-height: 1.45;
        }

        .check {
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          margin: 0;
          accent-color: var(--accent);
          cursor: pointer;
        }

        .check:disabled {
          cursor: default;
        }
      `}</style>
    </section>
  );
}
