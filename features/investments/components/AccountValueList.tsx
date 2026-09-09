import { useMemo, useState } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { Button } from "../../../components/atoms/Button";
import { formatAmount } from "../../../components/atoms/Amount";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { useAccounts } from "../../../hooks/useAccounts";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useAllInvestmentValuations } from "../../../hooks/useInvestmentValuations";
import { ACCOUNT_NOUN, formatInterestRate } from "../../../helpers/accounts";
import type { MoneyContext } from "../../../helpers/aggregations";
import { DOMAIN_CONFIG } from "../../domains/helpers/domainConfig";
import {
  costBasisAt,
  currentValue,
  gainFromValue,
  latestValuationAt,
  matchesSelector,
  selectorKey,
} from "../helpers/valuation";
import type { ValueSelector } from "../helpers/valuation";
import { InvestmentValuePanel } from "./InvestmentValuePanel";
import { ValuationModal } from "./ValuationModal";
import type {
  AccountDomain,
  Category,
  Currency,
  InterestRate,
  InvestmentValuation,
} from "../../../types";

interface Props {
  domain: AccountDomain;
  categories: Category[];
  ctx: MoneyContext;
  currency: Currency;
}

interface Row {
  key: string;
  selector: ValueSelector;
  name: string;
  sub?: string;
  rate?: InterestRate;
  invested: number;
  value: number;
  latest: InvestmentValuation | null;
  gainPct: number | null;
}

/** Cost basis needs the domain's whole history, not the page's month. */
const INCEPTION = new Date(2000, 0, 1);
const DATE = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

/**
 * Every account / pocket of the domain at a glance — what went in, what it
 * is worth, the gain — plus one row per category that still holds entries
 * filed under no account. Tapping a row opens its full panel underneath;
 * "Record value" goes straight to the value form. Mounted only on the Value
 * view, so its inception-to-date listener runs nowhere else.
 */
export function AccountValueList({ domain, categories, ctx, currency }: Props) {
  const { accounts, loading: accLoading, error: accError } = useAccounts(domain);
  const { transactions, loading: txLoading } = useDomainTransactions(domain, INCEPTION);
  const { valuations, loading, error } = useAllInvestmentValuations();
  const [selected, setSelected] = useState<string | null>(null);
  const [recording, setRecording] = useState<Row | null>(null);
  const now = useMemo(() => new Date(), []);
  const noun = ACCOUNT_NOUN[domain].singular;
  const accent = DOMAIN_CONFIG[domain].accent;

  const rows = useMemo<Row[]>(() => {
    const build = (
      selector: ValueSelector,
      name: string,
      sub: string | undefined,
      rate: InterestRate | undefined
    ): Row => {
      const invested = costBasisAt(transactions, selector, now, ctx);
      const value = currentValue(transactions, valuations, selector, rate, now, ctx);
      const latest = latestValuationAt(
        valuations.filter((v) => matchesSelector(v, selector)),
        now
      );
      return {
        key: selectorKey(selector),
        selector,
        name,
        sub,
        rate,
        invested,
        value,
        latest,
        gainPct: gainFromValue(invested, value),
      };
    };

    const byAccount = accounts
      .filter((a) => a.id)
      .map((a) => build({ accountId: a.id! }, a.name, a.provider, a.interestRate));

    // Entries that predate accounts, or were filed under none: one row per
    // category, only where there is something to show.
    const unassigned = categories
      .filter((c) => !c.parentId && c.id)
      .map((c) => build({ categoryId: c.id! }, c.name, `No ${noun}`, undefined))
      .filter((r) => r.invested > 0 || r.latest);

    return [...byAccount, ...unassigned].sort((a, b) => b.value - a.value);
  }, [accounts, categories, transactions, valuations, now, ctx, noun]);

  const open = rows.find((r) => r.key === selected) ?? null;
  const busy = accLoading || txLoading || loading;

  return (
    <>
      <Card accentColor={accent}>
        <SectionTitle title="Value" />
        {(error || accError) && <ErrorState error={(error ?? accError)!} />}

        {busy ? (
          <p className="empty">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="empty">
            Nothing here yet — file a {domain === "SAVING" ? "deposit" : "contribution"} under a{" "}
            {noun} to track its value
          </p>
        ) : (
          <ul className="list">
            {rows.map((r) => (
              <li key={r.key} className={`row${r.key === selected ? " is-open" : ""}`}>
                <button
                  type="button"
                  className="main"
                  aria-expanded={r.key === selected}
                  onClick={() => setSelected((s) => (s === r.key ? null : r.key))}
                >
                  <span className="name">
                    {r.name}
                    {r.rate && <span className="pill">{formatInterestRate(r.rate)}</span>}
                  </span>
                  <span className="meta">
                    {r.sub ? `${r.sub} · ` : ""}
                    In {formatAmount(r.invested, currency)}
                    {r.latest
                      ? ` · checked ${DATE.format(r.latest.asOf.toDate())}`
                      : r.rate
                        ? " · estimated"
                        : " · no value check yet"}
                  </span>
                </button>
                <span className="right">
                  <span className="amount">{formatAmount(r.value, currency)}</span>
                  {r.gainPct !== null && (
                    <span className={`gain ${r.value - r.invested >= 0 ? "up" : "down"}`}>
                      {r.value - r.invested >= 0 ? "+" : ""}
                      {r.gainPct.toFixed(1)}%
                    </span>
                  )}
                </span>
                <Button size="sm" onClick={() => setRecording(r)}>
                  Record value
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {open && (
        <InvestmentValuePanel
          key={open.key}
          selector={open.selector}
          title={open.name}
          rate={open.rate}
          transactions={transactions}
          loading={txLoading}
          ctx={ctx}
          currency={currency}
          accent={accent}
        />
      )}

      {recording && (
        <ValuationModal
          open
          selector={recording.selector}
          name={recording.name}
          costBasis={recording.invested}
          currency={currency}
          onClose={() => setRecording(null)}
        />
      )}

      <style jsx>{`
        .empty {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }

        .row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--line);
        }

        .row:last-child {
          border-bottom: none;
        }

        .main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
          border: none;
          background: transparent;
          color: inherit;
          font-family: inherit;
          text-align: left;
          padding: 0;
          cursor: pointer;
        }

        .name {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--fg-0);
        }

        .is-open .name {
          color: ${accent};
        }

        .pill {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 1px 6px;
          border-radius: 999px;
          border: 1px solid ${accent};
          color: ${accent};
        }

        .meta {
          font-size: 0.72rem;
          color: var(--fg-2);
        }

        .right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
        }

        .amount {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--fg-0);
        }

        .gain {
          font-size: 0.72rem;
        }

        .up {
          color: var(--accent);
        }

        .down {
          color: var(--accent-hot);
        }
      `}</style>
    </>
  );
}
