import { useState } from "react";
import { Button } from "../../../components/atoms/Button";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { CategoryIcon } from "../../../components/atoms/CategoryIcon";
import { RangeAmount } from "../../../components/atoms/RangeAmount";
import { IconDisc } from "../../../components/molecules/IconDisc";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { ListItem, ListItems } from "../../../components/molecules/ListItem";
import { toDate } from "../../../helpers/chartData";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useDateFormat } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import { COMMON_MESSAGES } from "../../../messages/common";
import { DOMAIN_MESSAGES } from "../messages";
import type { Category, Currency, Transaction } from "../../../types";

/** How many periods the card asks for at once; confirming one brings up the next. */
export const PENDING_VISIBLE = 5;

interface Props {
  /** Already the pending rows, newest first. */
  rows: Transaction[];
  categories: Category[];
  displayCurrency: Currency;
  onConfirm: (row: Transaction) => void;
  onKeepVariable: (row: Transaction) => void;
}

/**
 * Variable expenses whose period is over and still read as a range. They sit
 * on the Expenses page itself, whatever month it shows: a September grocery
 * run is asked for in October, when the month picker has moved on.
 */
export function PendingConfirmations({
  rows,
  categories,
  displayCurrency,
  onConfirm,
  onKeepVariable,
}: Props) {
  const t = useT(DOMAIN_MESSAGES);
  const [showAll, setShowAll] = useState(false);
  if (rows.length === 0) return null;
  const visible = showAll ? rows : rows.slice(0, PENDING_VISIBLE);
  const hidden = rows.length - visible.length;
  return (
    <Card>
      <SectionTitle title={t("pending.title")} subtitle={t("pending.subtitle")} />
      <ListItems>
        {visible.map((row) => (
          <PendingRow
            key={row.id}
            row={row}
            category={categories.find((c) => c.id === row.categoryId)}
            displayCurrency={displayCurrency}
            onConfirm={onConfirm}
            onKeepVariable={onKeepVariable}
          />
        ))}
      </ListItems>
      {hidden > 0 && (
        <div className="more">
          <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
            {t("pending.showOlder", { count: hidden })}
          </Button>
        </div>
      )}
      <style jsx>{`
        .more {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
        }
      `}</style>
    </Card>
  );
}

interface RowProps extends Omit<Props, "rows" | "categories"> {
  row: Transaction;
  category?: Category;
}

function PendingRow({ row, category, displayCurrency, onConfirm, onKeepVariable }: RowProps) {
  const t = useT(DOMAIN_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  const { formatNative } = useMoneyFormat();
  const { formatDate } = useDateFormat();
  const meta = [formatDate(toDate(row.occurredAt), "dayYear"), category?.name]
    .filter(Boolean)
    .join(" · ");
  return (
    <ListItem
      leading={
        category ? (
          <IconDisc domain="EXPENSE" size={36}>
            <CategoryIcon category={category} size={16} />
          </IconDisc>
        ) : undefined
      }
      name={row.name}
      meta={meta}
      amount={
        row.amountFloor !== undefined ? (
          <RangeAmount
            from={formatNative(row.amountFloor, row.currency, displayCurrency)}
            to={formatNative(row.amount, row.currency, displayCurrency)}
          />
        ) : (
          formatNative(row.amount, row.currency, displayCurrency)
        )
      }
      onClick={() => onConfirm(row)}
      aria-label={t("confirm.title", { name: row.name })}
      trailing={
        <KebabMenu
          aria-label={tc("action.actionsFor", { name: row.name })}
          actions={[
            { label: t("pending.confirm"), onSelect: () => onConfirm(row) },
            { label: t("pending.keep"), onSelect: () => onKeepVariable(row) },
          ]}
        />
      }
    />
  );
}
