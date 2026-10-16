import { Card } from "../../../components/atoms/Card";
import { CategoryIcon } from "../../../components/atoms/CategoryIcon";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { IconDisc } from "../../../components/molecules/IconDisc";
import { ListItem, ListItems } from "../../../components/molecules/ListItem";
import { toMonthlyAmount } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import type { PlanGroup } from "../hooks/useReviewStep";
import { useT } from "../../../hooks/useT";
import { COMMON_MESSAGES } from "../../../messages/common";
import { ONBOARDING_MESSAGES } from "../messages";

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
  const t = useT(ONBOARDING_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  const count = group.items.length;

  return (
    <Card>
      <SectionTitle
        title={t(`review.title.${group.domain}`)}
        subtitle={
          count
            ? t("review.summary", { count, amount: formatAmount(monthly, ctx.target) })
            : undefined
        }
        onAction={() => onEdit(group.href)}
        actionLabel={tc("action.edit")}
      />

      {count === 0 ? (
        <p className="empty">{t(`review.empty.${group.domain}`)}</p>
      ) : (
        <ListItems>
          {group.items.map((item) => {
            const category = group.categories.find((c) => c.id === item.categoryId);
            const perMonth =
              item.frequency === "MONTHLY"
                ? undefined
                : t("review.perMonth", {
                    amount: formatAmount(toMonthlyAmount(item, ctx), ctx.target),
                  });
            return (
              <ListItem
                key={item.id}
                leading={
                  <IconDisc domain={group.domain} size={36}>
                    {category ? <CategoryIcon category={category} size={16} /> : null}
                  </IconDisc>
                }
                name={item.name}
                meta={[tc(`frequency.${item.frequency}`), category?.name]
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
