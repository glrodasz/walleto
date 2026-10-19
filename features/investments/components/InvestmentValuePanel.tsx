import { useMemo, useState } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { Amount } from "../../../components/atoms/Amount";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { Button } from "../../../components/atoms/Button";
import { FlowChart } from "../../../components/molecules/FlowChart";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { removeInvestmentValuation } from "../../../hooks/useInvestmentValuations";
import { formatInterestRate } from "../../../helpers/accounts";
import type { MoneyContext } from "../../../helpers/aggregations";
import {
  costBasisAt,
  currentValue,
  depositsFor,
  gainFromValue,
  matchesSelector,
  positionSign,
  valuationSeries,
  valueChecks,
} from "../helpers/valuation";
import type { ValueSelector } from "../helpers/valuation";
import { checkedBy, interestAccrued } from "../helpers/interest";
import { ValuationModal } from "./ValuationModal";
import type {
  AccountDomain,
  Category,
  Currency,
  InterestRate,
  InvestmentValuation,
  Transaction,
} from "../../../types";
import { useDateFormat } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import { COMMON_MESSAGES } from "../../../messages/common";
import { INVESTMENT_MESSAGES } from "../messages";

interface Props {
  /** Decides the sign of the maths and the words: a debt shows repaid / owed / interest. */
  domain: AccountDomain;
  selector: ValueSelector;
  /** Account name, or "{category} · no account" for pre-account entries. */
  title: string;
  /** The account's quoted rate, when it has one. */
  rate?: InterestRate;
  /** Inception-to-date rows of the domain; the parent subscribes once. */
  transactions: Transaction[];
  /** Every valuation, domains filled in (`withDomain`); the panel picks its own. */
  valuations: InvestmentValuation[];
  loading?: boolean;
  /** The domain's categories, so a recorded gain can name one. */
  categories?: Category[];
  /** Where most of this position's money came in; prefills a new check. */
  suggestedCategoryId?: string | null;
  ctx: MoneyContext;
  currency: Currency;
  accent?: string;
}

const CHART_MONTHS = 12;

/**
 * What one position is worth versus what went into it: the latest value
 * check carried forward — compounding at the account's rate when it quotes
 * one — plus every deposit since; before any check, the interest estimate.
 * For a debt the same panel reads repaid against owed, with the interest
 * accrued since the first balance in place of the gain, and a dash for the
 * balance until one has been recorded.
 */
export function InvestmentValuePanel({
  domain,
  selector,
  title,
  rate,
  transactions,
  valuations: allValuations,
  loading,
  categories,
  suggestedCategoryId,
  ctx,
  currency,
  accent = "var(--domain-investment)",
}: Props) {
  const { formatDate, language } = useDateFormat();
  const { formatAmount, formatPercent, separator } = useMoneyFormat();
  const t = useT(INVESTMENT_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  const owes = domain === "DEBT";
  const sign = positionSign(domain);
  const valuations = useMemo(
    () =>
      allValuations
        .filter((v) => matchesSelector(v, selector))
        .sort((a, b) => b.asOf.toDate().getTime() - a.asOf.toDate().getTime()),
    [allValuations, selector]
  );
  const [modal, setModal] = useState<{ open: boolean; editing?: InvestmentValuation }>({
    open: false,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const invested = useMemo(
    () => costBasisAt(transactions, selector, now, ctx),
    [transactions, selector, now, ctx]
  );
  const value = useMemo(
    () => currentValue(transactions, valuations, selector, rate, now, ctx, sign),
    [transactions, valuations, selector, rate, now, ctx, sign]
  );
  // The check the value is read from: one dated later hasn't happened yet.
  const latest = valuations.find((v) => checkedBy(v.asOf.toDate(), now)) ?? null;
  const gain = value - invested;
  const gainPct = gainFromValue(invested, value);
  // A debt's third figure: what repayments did not explain since the first balance.
  const interest = useMemo(
    () =>
      owes
        ? interestAccrued(
            depositsFor(transactions, selector, ctx),
            valueChecks(valuations, selector, ctx, sign),
            rate,
            now
          )
        : null,
    [owes, transactions, valuations, selector, ctx, sign, rate, now]
  );

  const series = useMemo(
    () =>
      valuationSeries(
        transactions,
        valuations,
        selector,
        ctx,
        CHART_MONTHS,
        now,
        rate,
        sign,
        language
      ),
    [transactions, valuations, selector, ctx, now, rate, sign, language]
  );

  const rateLabel = rate ? formatInterestRate(rate, separator, language) : null;
  const valueMeta = latest
    ? rateLabel
      ? t("panel.checkedRate", {
          date: formatDate(latest.asOf.toDate(), "dayYear"),
          rate: rateLabel,
        })
      : t("panel.checked", { date: formatDate(latest.asOf.toDate(), "dayYear") })
    : owes
      ? t("panel.noBalanceCheck")
      : rateLabel
        ? t("panel.estimatedAt", { rate: rateLabel })
        : t("panel.noValueCheck");

  const del = async (id: string) => {
    setDeletingId(id);
    try {
      await removeInvestmentValuation(id);
    } catch (err) {
      console.error("Failed to delete valuation:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Card accentColor={accent}>
        <div className="head">
          <SectionTitle
            title={t(owes ? "panel.title.balance" : "panel.title.value", { name: title })}
          />
          <Button variant="primary" size="sm" onClick={() => setModal({ open: true })}>
            {t(owes ? "update.balance" : "update.value")}
          </Button>
        </div>

        <div className="figures">
          <div>
            <span className="label">{t(owes ? "panel.repaid" : "panel.invested")}</span>
            <Amount value={invested} currency={currency} size="md" />
          </div>
          <div>
            <span className="label">{t(owes ? "panel.owed" : "panel.currentValue")}</span>
            {owes && !latest ? (
              <span className="dash">—</span>
            ) : (
              <Amount
                value={value}
                currency={currency}
                size="md"
                approximate={Boolean(rate) || (!!latest && latest.currency !== currency)}
              />
            )}
            <span className="meta">{valueMeta}</span>
          </div>
          {owes ? (
            interest !== null && (
              <div>
                <span className="label">{t("panel.interest")}</span>
                <Amount
                  value={interest}
                  currency={currency}
                  size="md"
                  approximate={Boolean(rate)}
                />
                <span className="meta">{t("panel.sinceFirstBalance")}</span>
              </div>
            )
          ) : (
            <div>
              <span className="label">{t("panel.gain")}</span>
              <Amount value={gain} currency={currency} size="md" colorize />
              {gainPct !== null && (
                <span className={`meta ${gain >= 0 ? "up" : "down"}`}>
                  {gain >= 0 ? "+" : ""}
                  {formatPercent(gainPct)}
                </span>
              )}
            </div>
          )}
        </div>

        <FlowChart
          data={series}
          currency={currency}
          loading={Boolean(loading)}
          labelA={t(owes ? "panel.repaid" : "panel.invested")}
          labelB={t(owes ? "panel.owed" : "panel.value")}
          colorA="var(--fg-2)"
          colorB={accent}
          height={200}
        />

        {valuations.length > 0 && (
          <ul className="history">
            {valuations.map((v) => (
              <li key={v.id} className="row">
                <span className="row-date">{formatDate(v.asOf.toDate(), "dayYear")}</span>
                <span className="row-figures">
                  <span className="row-value">{formatAmount(v.value, v.currency)}</span>
                  {!owes && (
                    <span className={`row-pct ${v.gainPct >= 0 ? "up" : "down"}`}>
                      {t("panel.gainOn", {
                        pct: `${v.gainPct >= 0 ? "+" : ""}${formatPercent(v.gainPct)}`,
                        amount: formatAmount(v.costBasis, v.currency),
                      })}
                    </span>
                  )}
                  {v.note && <span className="row-note">{v.note}</span>}
                </span>
                <KebabMenu
                  aria-label={t("panel.actions", { date: formatDate(v.asOf.toDate(), "dayYear") })}
                  actions={[
                    {
                      label: tc("action.edit"),
                      onSelect: () => setModal({ open: true, editing: v }),
                    },
                    {
                      label: deletingId === v.id ? t("panel.deleting") : tc("action.delete"),
                      onSelect: () => v.id && del(v.id),
                      danger: true,
                      disabled: deletingId === v.id,
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}

        <style jsx>{`
          .head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .figures {
            display: flex;
            gap: 28px;
            flex-wrap: wrap;
            padding: 4px 0 12px;
          }

          .figures > div {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .label {
            font-size: 0.72rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: var(--fg-2);
          }

          .meta {
            font-size: 0.75rem;
            color: var(--fg-2);
          }

          .dash {
            font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--fg-2);
          }

          .up {
            color: var(--positive);
          }

          .down {
            color: var(--negative);
          }

          .history {
            list-style: none;
            margin: 12px 0 0;
            padding: 12px 0 0;
            border-top: 1px solid var(--line);
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .row {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .row-date {
            flex: 0 0 120px;
            font-size: 0.82rem;
            color: var(--fg-1);
          }

          .row-figures {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 1px;
          }

          .row-value {
            font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
            font-variant-numeric: tabular-nums;
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--fg-0);
          }

          .row-pct {
            font-size: 0.72rem;
          }

          .row-note {
            font-size: 0.72rem;
            color: var(--fg-2);
          }
        `}</style>
      </Card>

      {/* Outside the Card on purpose: the card is glass, and backdrop-filter
          makes it the containing block for fixed children — a modal inside it
          would size itself to the card instead of the viewport. */}
      <ValuationModal
        open={modal.open}
        domain={domain}
        selector={selector}
        name={title}
        costBasis={invested}
        latestValue={owes && latest ? value : undefined}
        currency={currency}
        categories={categories}
        suggestedCategoryId={suggestedCategoryId}
        valuation={modal.editing}
        onClose={() => setModal({ open: false })}
      />
    </>
  );
}
