import { Card } from "../../../components/atoms/Card";
import { CategoryIcon } from "../../../components/atoms/CategoryIcon";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { IconDisc } from "../../../components/molecules/IconDisc";
import { ListItem, ListItems } from "../../../components/molecules/ListItem";
import { toMonthlyAmount } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { FREQUENCY_LABELS } from "../../../constants";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import type { PlanGroup } from "../hooks/useReviewStep";

interface Props {
  group: PlanGroup;
  /** The group's monthly total, already converted. */
  monthly: number;
  ctx: MoneyContext;
  onEdit: (href: string) => void;
}

/** One domain of the plan on the Review step, with the way back to its step. */
export function PlanPreviewList({ group, monthly, ctx, onEdit }: Props) {
  const { formatAmount, formatNative } = useMoneyFormat();
  const count = group.items.length;
  const noun = group.domain === "INCOME" ? "income" : "expenses";

  return (
    <Card>
      <SectionTitle
        title={group.title}
        subtitle={
          count
            ? `${count} ${count === 1 ? "item" : "items"} · ${formatAmount(monthly, ctx.target)} a month`
            : undefined
        }
        onAction={() => onEdit(group.href)}
        actionLabel="Edit"
      />

      {count === 0 ? (
        <p className="empty">No {noun} in your plan yet.</p>
      ) : (
        <ListItems>
          {group.items.map((item) => {
            const category = group.categories.find((c) => c.id === item.categoryId);
            const perMonth =
              item.frequency === "MONTHLY"
                ? undefined
                : `≈ ${formatAmount(toMonthlyAmount(item, ctx), ctx.target)} / month`;
            return (
              <ListItem
                key={item.id}
                leading={
                  <IconDisc domain={group.domain} size={36}>
                    {category ? <CategoryIcon category={category} size={16} /> : null}
                  </IconDisc>
                }
                name={item.name}
                meta={[FREQUENCY_LABELS[item.frequency], category?.name]
                  .filter(Boolean)
                  .join(" · ")}
                amount={formatNative(item.amount, item.currency, ctx.target)}
                amountMeta={perMonth}
              />
            );
          })}
        </ListItems>
      )}

      <style jsx>{`
        .empty {
          margin: 0;
          font-size: 0.875rem;
          color: var(--fg-2);
        }
      `}</style>
    </Card>
  );
}
