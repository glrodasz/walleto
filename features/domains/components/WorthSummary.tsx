import type { ReactNode } from "react";
import { Card } from "../../../components/atoms/Card";
import { Amount } from "../../../components/atoms/Amount";
import { DeltaPill } from "../../../components/molecules/DeltaPill";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useT } from "../../../hooks/useT";
import { DOMAIN_MESSAGES } from "../messages";
import type { MonthWindow } from "../helpers/months";
import type { AccountDomain, Currency } from "../../../types";

interface Props {
  domain: AccountDomain;
  window: MonthWindow;
  /** What the domain holds (or, on a debt, owes) at the end of the selected month. */
  worth: number;
  /** The same at the end of the month before. */
  previous: number;
  /** Label of the previous month ("August 2026"). */
  previousLabel: string | null;
  currency: Currency;
  approximate?: boolean;
  /** Some category is hidden from the chart and left out of the figure. */
  hiddenLeftOut?: boolean;
  /** The Month / Total switch, top right. */
  toolbar?: ReactNode;
}

/**
 * The summary's "Total": where the domain stands at the end of the selected
 * month — the running sum of every contribution and every gain the checks
 * reported — and how much that moved during the month. A debt says what is
 * owed, so it going up is the bad direction.
 */
export function WorthSummary({
  domain,
  window,
  worth,
  previous,
  previousLabel,
  currency,
  approximate,
  hiddenLeftOut = false,
  toolbar,
}: Props) {
  const { formatAmount } = useMoneyFormat();
  const t = useT(DOMAIN_MESSAGES);
  const owes = domain === "DEBT";
  const change = worth - previous;
  const pct = previous !== 0 ? (change / Math.abs(previous)) * 100 : null;
  const label = window.isCurrent
    ? t(owes ? "worth.todayOwed" : "worth.today")
    : t(owes ? "worth.endOwed" : "worth.end", { month: window.longLabel });

  return (
    <Card>
      {toolbar && <div className="toolbar">{toolbar}</div>}
      <div className="summary">
        <div className="panel">
          <span className="label">{label}</span>
          <span className="figure">
            <Amount value={worth} currency={currency} size="lg" approximate={approximate} />
          </span>
          {hiddenLeftOut && <span className="line muted">{t("worth.hiddenLeftOut")}</span>}
        </div>

        <div className="panel change">
          <span className="label">{t("worth.change", { month: window.longLabel })}</span>
          <span className="figure">
            <Amount value={change} currency={currency} size="md" approximate={approximate} />
            {pct !== null && change !== 0 && <DeltaPill pct={pct} upIsGood={!owes} />}
          </span>
          {previousLabel && (
            <span className="line">
              {t("worth.comparedTo", {
                amount: formatAmount(previous, currency),
                month: previousLabel,
              })}
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        .toolbar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 12px;
        }

        .summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .change {
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

        .figure {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .line {
          font-size: 0.82rem;
          color: var(--fg-1);
        }

        .muted {
          font-size: 0.78rem;
          color: var(--fg-2);
        }

        @media (max-width: 767px) {
          .summary {
            grid-template-columns: 1fr;
          }

          .change {
            padding-left: 0;
            padding-top: 16px;
            border-left: none;
            border-top: 1px solid var(--line);
          }
        }
      `}</style>
    </Card>
  );
}
