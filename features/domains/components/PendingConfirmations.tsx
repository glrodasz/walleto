import { useEffect, useState } from "react";
import { Button } from "../../../components/atoms/Button";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { CategoryIcon } from "../../../components/atoms/CategoryIcon";
import { RangeAmount } from "../../../components/atoms/RangeAmount";
import { IconDisc } from "../../../components/molecules/IconDisc";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { Modal } from "../../../components/molecules/Modal";
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
/** On wide screens the card shares a row with Top categories and Drafts, so it asks for fewer. */
export const PENDING_VISIBLE_WIDE = 3;
const WIDE_QUERY = "(min-width: 1920px)";

function useIsWide(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(WIDE_QUERY);
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return wide;
}

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
  const wide = useIsWide();
  if (rows.length === 0) return null;
  // On wide screens the card keeps its height in the row it shares, so the
  // older periods open in a modal that scrolls on its own; elsewhere they
  // expand in place.
  const inline = showAll && !wide;
  const visible = inline ? rows : rows.slice(0, wide ? PENDING_VISIBLE_WIDE : PENDING_VISIBLE);
  const hidden = rows.length - visible.length;
  const renderRows = (list: Transaction[], onPick: (row: Transaction) => void) => (
    <ListItems>
      {list.map((row) => (
        <PendingRow
          key={row.id}
          row={row}
          category={categories.find((c) => c.id === row.categoryId)}
          displayCurrency={displayCurrency}
          onConfirm={onPick}
          onKeepVariable={onKeepVariable}
        />
      ))}
    </ListItems>
  );
  return (
    <Card>
      <SectionTitle title={t("pending.title")} subtitle={t("pending.subtitle")} />
      {renderRows(visible, onConfirm)}
      {hidden > 0 && (
        <div className="more">
          <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
            {t("pending.showOlder", { count: hidden })}
          </Button>
        </div>
      )}
      {wide && (
        <Modal
          solid
          open={showAll}
          title={`${t("pending.title")} (${rows.length})`}
          onClose={() => setShowAll(false)}
        >
          <div className="scroll">
            {renderRows(rows, (row) => {
              setShowAll(false);
              onConfirm(row);
            })}
          </div>
        </Modal>
      )}
      <style jsx>{`
        .more {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
        }

        /* The list scrolls under a title that stays put. */
        .scroll {
          max-height: calc(100vh - 160px);
          max-height: calc(100dvh - 160px);
          overflow-y: auto;
          margin-right: -8px;
          padding-right: 8px;
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
