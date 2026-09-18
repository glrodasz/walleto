import { useState } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { Button } from "../../../components/atoms/Button";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { ACCOUNT_NOUN, formatInterestRate } from "../../../helpers/accounts";
import type { MoneyContext } from "../../../helpers/aggregations";
import { DOMAIN_CONFIG } from "../../domains/helpers/domainConfig";
import { useDomainValue } from "../hooks/useDomainValue";
import { dominantCategoryId } from "../helpers/valuation";
import type { AccountValueRow } from "../helpers/domainValue";
import { InvestmentValuePanel } from "./InvestmentValuePanel";
import { ValuationModal } from "./ValuationModal";
import type { AccountDomain, Category, Currency } from "../../../types";
import { useDateFormat } from "../../../hooks/usePreferences";

interface Props {
  domain: AccountDomain;
  categories: Category[];
  ctx: MoneyContext;
  currency: Currency;
}

/**
 * Every account / pocket of the domain at a glance — what went in, what it
 * is worth, the gain — plus one "No account" row for whatever is filed under
 * none (including valuations from before accounts existed). Tapping a row
 * opens its full panel underneath; "Record value" goes straight to the value
 * form. Mounted only on the Value view, so its inception-to-date listener
 * runs nowhere else on this page.
 */
export function AccountValueList({ domain, categories, ctx, currency }: Props) {
  const { formatDate } = useDateFormat();
  const { formatAmount } = useMoneyFormat();
  const {
    rows,
    transactions,
    valuations,
    loading: busy,
    error,
  } = useDomainValue(domain, categories, ctx);
  const [selected, setSelected] = useState<string | null>(null);
  const [recording, setRecording] = useState<AccountValueRow | null>(null);
  const noun = ACCOUNT_NOUN[domain].singular;
  const accent = DOMAIN_CONFIG[domain].accent;

  const open = rows.find((r) => r.key === selected) ?? null;
  // Prefills the value form: most accounts hold one category, so the common
  // case costs no thought.
  const suggestFor = (row: AccountValueRow) =>
    dominantCategoryId(transactions, row.selector, categories, ctx);

  return (
    <>
      <Card accentColor={accent}>
        <SectionTitle title="Value" />
        {error && <ErrorState error={error} />}

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
                      ? ` · checked ${formatDate(r.latest.asOf.toDate(), "day")}`
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
          valuations={valuations}
          categories={categories}
          suggestedCategoryId={suggestFor(open)}
          loading={busy}
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
          categories={categories}
          suggestedCategoryId={suggestFor(recording)}
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
