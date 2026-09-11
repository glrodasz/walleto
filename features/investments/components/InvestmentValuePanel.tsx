import { useMemo, useState } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { Amount, formatAmount } from "../../../components/atoms/Amount";
import { Button } from "../../../components/atoms/Button";
import { FlowChart } from "../../../components/molecules/FlowChart";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { removeInvestmentValuation } from "../../../hooks/useInvestmentValuations";
import { formatInterestRate } from "../../../helpers/accounts";
import type { MoneyContext } from "../../../helpers/aggregations";
import {
  costBasisAt,
  currentValue,
  gainFromValue,
  matchesSelector,
  valuationSeries,
} from "../helpers/valuation";
import type { ValueSelector } from "../helpers/valuation";
import { ValuationModal } from "./ValuationModal";
import type { Currency, InterestRate, InvestmentValuation, Transaction } from "../../../types";
import { useDateFormat } from "../../../hooks/usePreferences";

interface Props {
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
  ctx: MoneyContext;
  currency: Currency;
  accent?: string;
}

const CHART_MONTHS = 12;

/**
 * What one position is worth versus what went into it: the latest value
 * check carried forward — compounding at the account's rate when it quotes
 * one — plus every deposit since; before any check, the interest estimate.
 */
export function InvestmentValuePanel({
  selector,
  title,
  rate,
  transactions,
  valuations: allValuations,
  loading,
  ctx,
  currency,
  accent = "var(--domain-investment)",
}: Props) {
  const { formatDate } = useDateFormat();
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
    () => currentValue(transactions, valuations, selector, rate, now, ctx),
    [transactions, valuations, selector, rate, now, ctx]
  );
  const latest = valuations[0] ?? null;
  const gain = value - invested;
  const gainPct = gainFromValue(invested, value);

  const series = useMemo(
    () => valuationSeries(transactions, valuations, selector, ctx, CHART_MONTHS, now, rate),
    [transactions, valuations, selector, ctx, now, rate]
  );

  const valueMeta = latest
    ? `checked ${formatDate(latest.asOf.toDate(), "dayYear")}${rate ? `, ${formatInterestRate(rate)} since` : ""}`
    : rate
      ? `estimated at ${formatInterestRate(rate)}`
      : "no value check yet";

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
    <Card accentColor={accent}>
      <div className="head">
        <SectionTitle title={`${title} — value`} />
        <Button variant="primary" size="sm" onClick={() => setModal({ open: true })}>
          Record value
        </Button>
      </div>

      <div className="figures">
        <div>
          <span className="label">Invested</span>
          <Amount value={invested} currency={currency} size="md" />
        </div>
        <div>
          <span className="label">Current value</span>
          <Amount
            value={value}
            currency={currency}
            size="md"
            approximate={Boolean(rate) || (!!latest && latest.currency !== currency)}
          />
          <span className="meta">{valueMeta}</span>
        </div>
        <div>
          <span className="label">Gain</span>
          <Amount value={gain} currency={currency} size="md" colorize />
          {gainPct !== null && (
            <span className={`meta ${gain >= 0 ? "up" : "down"}`}>
              {gain >= 0 ? "+" : ""}
              {gainPct.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <FlowChart
        data={series}
        currency={currency}
        loading={Boolean(loading)}
        labelA="Invested"
        labelB="Value"
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
                <span className={`row-pct ${v.gainPct >= 0 ? "up" : "down"}`}>
                  {v.gainPct >= 0 ? "+" : ""}
                  {v.gainPct.toFixed(1)}% on {formatAmount(v.costBasis, v.currency)}
                </span>
                {v.note && <span className="row-note">{v.note}</span>}
              </span>
              <KebabMenu
                aria-label={`Actions for valuation ${formatDate(v.asOf.toDate(), "dayYear")}`}
                actions={[
                  { label: "Edit", onSelect: () => setModal({ open: true, editing: v }) },
                  {
                    label: deletingId === v.id ? "Deleting…" : "Delete",
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

      <ValuationModal
        open={modal.open}
        selector={selector}
        name={title}
        costBasis={invested}
        currency={currency}
        valuation={modal.editing}
        onClose={() => setModal({ open: false })}
      />

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

        .up {
          color: var(--accent);
        }

        .down {
          color: var(--accent-hot);
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
  );
}
