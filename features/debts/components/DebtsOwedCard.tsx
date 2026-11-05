import { useMemo, useState } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { Amount } from "../../../components/atoms/Amount";
import { Badge } from "../../../components/atoms/Badge";
import { Button } from "../../../components/atoms/Button";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { ListItem, ListItems } from "../../../components/molecules/ListItem";
import type { MoneyContext } from "../../../helpers/aggregations";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useDateFormat } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import { useDomainValue } from "../../investments/hooks/useDomainValue";
import { ValuationModal } from "../../investments/components/ValuationModal";
import { debtSummary } from "../helpers/debtSummary";
import type { DebtSummaryRow } from "../helpers/debtSummary";
import { DebtPaymentModal } from "./DebtPaymentModal";
import type { DebtPaymentMode } from "./DebtPaymentModal";
import { DEBT_MESSAGES } from "../messages";
import type { Category, Currency, RecurrentTransaction } from "../../../types";

interface Props {
  /** The DEBT categories. */
  categories: Category[];
  /** The DEBT plan, for each debt's monthly payment. */
  items: RecurrentTransaction[];
  ctx: MoneyContext;
  currency: Currency;
}

/**
 * Top of the Debts page, whatever month or view it shows: every debt with
 * what is still owed and what the plan pays towards it each month — two
 * different numbers, side by side, so neither is mistaken for the other.
 * Each row has the quick actions a debt needs: pay part of it, pay it all,
 * write down more borrowing, or correct the balance.
 */
export function DebtsOwedCard({ categories, items, ctx, currency }: Props) {
  const t = useT(DEBT_MESSAGES);
  const { formatAmount } = useMoneyFormat();
  const { formatDate } = useDateFormat();
  const { rows, transactions, loading, error } = useDomainValue("DEBT", categories, ctx);
  const summary = useMemo(
    () => debtSummary(rows, items, transactions, ctx),
    [rows, items, transactions, ctx]
  );
  const [paying, setPaying] = useState<{ mode: DebtPaymentMode; debt: DebtSummaryRow } | null>(
    null
  );
  const [updating, setUpdating] = useState<DebtSummaryRow | null>(null);

  if (loading || (summary.rows.length === 0 && !error)) return null;

  const meta = (d: DebtSummaryRow) =>
    [
      d.row.sub,
      d.monthly > 0
        ? t("owed.perMonth", { amount: formatAmount(d.monthly, currency) })
        : t("owed.noPlan"),
      d.row.latest
        ? formatDate(d.row.latest.asOf.toDate(), "day")
        : d.row.known
          ? null
          : t("owed.noBalance"),
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <Card accentColor="var(--domain-debt)">
      <SectionTitle title={t("owed.title")} info={t("owed.info")} />
      {error && <ErrorState error={error} />}

      <div className="totals">
        <div className="total">
          <span className="label">{t("owed.total")}</span>
          <Amount value={summary.owed} currency={currency} size="lg" />
        </div>
        <div className="total monthly">
          <span className="label">{t("owed.monthly")}</span>
          <Amount value={summary.monthly} currency={currency} size="md" />
        </div>
      </div>
      {summary.unknown > 0 && (
        <p className="unknown">{t("owed.unknown", { count: summary.unknown })}</p>
      )}

      <ListItems>
        {summary.rows.map((d) => {
          const owes = d.row.known && !d.paidOff;
          const actions = [
            ...(owes
              ? [{ label: t("owed.payAll"), onSelect: () => setPaying({ mode: "all", debt: d }) }]
              : []),
            { label: t("owed.borrow"), onSelect: () => setPaying({ mode: "borrow", debt: d }) },
            { label: t("owed.update"), onSelect: () => setUpdating(d) },
          ];
          return (
            <ListItem
              key={d.row.key}
              name={d.row.name}
              meta={meta(d)}
              muted={d.paidOff}
              amount={d.row.known ? formatAmount(Math.max(0, d.row.value), currency) : "—"}
              amountMeta={
                d.paidOff ? (
                  <Badge tone="success" caps size="sm">
                    {t("owed.paidOff")}
                  </Badge>
                ) : undefined
              }
              trailing={
                <span className="actions">
                  {owes ? (
                    <Button size="sm" onClick={() => setPaying({ mode: "part", debt: d })}>
                      {t("owed.pay")}
                    </Button>
                  ) : !d.row.known ? (
                    <Button size="sm" onClick={() => setUpdating(d)}>
                      {t("owed.update")}
                    </Button>
                  ) : null}
                  <KebabMenu
                    aria-label={t("owed.actionsFor", { name: d.row.name })}
                    actions={actions}
                  />
                </span>
              }
            />
          );
        })}
      </ListItems>

      {paying && (
        <DebtPaymentModal
          mode={paying.mode}
          debt={paying.debt}
          categories={categories}
          ctx={ctx}
          onClose={() => setPaying(null)}
        />
      )}
      {updating && (
        <ValuationModal
          open
          domain="DEBT"
          selector={updating.row.selector}
          name={updating.row.name}
          costBasis={updating.row.invested}
          latestValue={updating.row.known ? updating.row.value : undefined}
          currency={currency}
          categories={categories}
          suggestedCategoryId={updating.categoryId}
          onClose={() => setUpdating(null)}
        />
      )}

      <style jsx>{`
        .totals {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 8px;
        }

        .total {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .monthly {
          padding-left: 24px;
          border-left: 1px solid var(--line);
        }

        .label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--fg-2);
        }

        .unknown {
          margin: 0 0 4px;
          font-size: 0.78rem;
          color: var(--fg-2);
        }

        .actions {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>
    </Card>
  );
}
