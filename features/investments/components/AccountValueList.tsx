import { useMemo, useState } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { Button } from "../../../components/atoms/Button";
import { Chip } from "../../../components/atoms/Chip";
import { AccountCreator } from "../../../components/molecules/AccountCreator";
import { createAccount } from "../../../hooks/useAccounts";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { formatInterestRate } from "../../../helpers/accounts";
import { useT } from "../../../hooks/useT";
import { COMMON_MESSAGES } from "../../../messages/common";
import { FIELD_MESSAGES } from "../../../messages/fields";
import { INVESTMENT_MESSAGES } from "../messages";
import type { MoneyContext } from "../../../helpers/aggregations";
import { convert } from "../../../helpers/fx";
import { DOMAIN_CONFIG } from "../../domains/helpers/domainConfig";
import { useDomainValue } from "../hooks/useDomainValue";
import { dominantCategoryId } from "../helpers/valuation";
import type { AccountValueRow } from "../helpers/domainValue";
import { InvestmentValuePanel } from "./InvestmentValuePanel";
import { ValuationModal } from "./ValuationModal";
import { Badge } from "../../../components/atoms/Badge";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { debtSummary } from "../../debts/helpers/debtSummary";
import type { DebtSummaryRow } from "../../debts/helpers/debtSummary";
import { DebtPaymentModal } from "../../debts/components/DebtPaymentModal";
import type { DebtPaymentMode } from "../../debts/components/DebtPaymentModal";
import { DEBT_MESSAGES } from "../../debts/messages";
import type { AccountDomain, Category, Currency, RecurrentTransaction } from "../../../types";
import { useDateFormat } from "../../../hooks/usePreferences";

interface Props {
  domain: AccountDomain;
  categories: Category[];
  ctx: MoneyContext;
  currency: Currency;
  /** Debts: the plan, for each debt's monthly payment and the quick actions. */
  items?: RecurrentTransaction[];
}

/**
 * Every account / pocket of the domain at a glance — what went in, what it
 * is worth, the gain — plus one "No account" row for whatever is filed under
 * none (including valuations from before accounts existed). Tapping a row
 * opens its full panel underneath; "Update value" goes straight to the value
 * form. Mounted only on the Value view, so its inception-to-date listener
 * runs nowhere else on this page. On debts the same list reads as balances:
 * what was repaid, what is still owed — a dash until a balance is recorded.
 * New accounts are added right here with the Settings creator; the accounts
 * listener brings the new row in. A debt's row also says what the plan pays
 * towards it each month and has the quick actions a debt needs: pay part of
 * it, pay it all, write down more borrowing, or correct the balance.
 */
export function AccountValueList({ domain, categories, ctx, currency, items = [] }: Props) {
  const { formatDate, language } = useDateFormat();
  const { formatAmount, formatNative, formatPercent, separator } = useMoneyFormat();
  const {
    rows,
    accounts,
    transactions,
    valuations,
    loading: busy,
    error,
  } = useDomainValue(domain, categories, ctx);
  const [selected, setSelected] = useState<string | null>(null);
  const [recording, setRecording] = useState<AccountValueRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { userDoc } = useUserDoc();
  const t = useT(INVESTMENT_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  const tf = useT(FIELD_MESSAGES);
  const accent = DOMAIN_CONFIG[domain].accent;
  const owes = domain === "DEBT";
  const td = useT(DEBT_MESSAGES);
  const [paying, setPaying] = useState<{ mode: DebtPaymentMode; debt: DebtSummaryRow } | null>(
    null
  );
  const debts = useMemo(() => {
    if (!owes) return new Map<string, DebtSummaryRow>();
    const summary = debtSummary(rows, items, transactions, ctx);
    return new Map(summary.rows.map((d) => [d.row.key, d]));
  }, [owes, rows, items, transactions, ctx]);

  const open = rows.find((r) => r.key === selected) ?? null;
  // Prefills the value form: most accounts hold one category, so the common
  // case costs no thought.
  const suggestFor = (row: AccountValueRow) =>
    dominantCategoryId(transactions, row.selector, categories, ctx);
  // An account kept in another currency: the converted value reads big, its
  // own currency's figure small underneath — never twice the same number.
  const original = (row: AccountValueRow) =>
    row.currency && row.currency !== ctx.target && row.known
      ? formatNative(
          convert(row.value, ctx.target, row.currency, ctx.rates),
          row.currency,
          currency
        )
      : null;
  const monthlyOf = (row: AccountValueRow) => debts.get(row.key)?.monthly ?? 0;
  const meta = (row: AccountValueRow) =>
    [
      row.sub,
      owes
        ? monthlyOf(row) > 0
          ? td("owed.perMonth", { amount: formatAmount(monthlyOf(row), currency) })
          : td("owed.noPlan")
        : t("list.in", { amount: formatAmount(row.invested, currency) }),
      row.latest
        ? t("status.checked", { date: formatDate(row.latest.asOf.toDate(), "day") })
        : owes && row.known
          ? t("status.borrowed", { amount: formatAmount(row.borrowed, currency) })
          : t(owes ? "status.noBalance" : row.rate ? "status.estimated" : "status.noCheck"),
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <>
      <Card accentColor={accent}>
        <SectionTitle title={t(owes ? "list.title.balances" : "list.title.value")} />
        {error && <ErrorState error={error} />}

        {busy ? (
          <p className="empty">{tc("state.loading")}</p>
        ) : rows.length === 0 ? (
          <p className="empty">{t(`list.empty.${domain}`)}</p>
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
                    {r.rate && (
                      <span className="pill">
                        {formatInterestRate(r.rate, separator, language)}
                      </span>
                    )}
                  </span>
                  <span className="meta">{meta(r)}</span>
                </button>
                <span className="right">
                  <span className="amount">{r.known ? formatAmount(r.value, currency) : "—"}</span>
                  {original(r) && <span className="original">{original(r)}</span>}
                  {debts.get(r.key)?.paidOff && (
                    <Badge tone="success" caps size="sm">
                      {td("owed.paidOff")}
                    </Badge>
                  )}
                  {r.gainPct !== null && (
                    <span className={`gain ${r.value - r.invested >= 0 ? "up" : "down"}`}>
                      {r.value - r.invested >= 0 ? "+" : ""}
                      {formatPercent(r.gainPct)}
                    </span>
                  )}
                </span>
                {owes && debts.get(r.key) ? (
                  <DebtActions
                    debt={debts.get(r.key)!}
                    onPay={(mode, debt) => setPaying({ mode, debt })}
                    onUpdate={() => setRecording(r)}
                  />
                ) : (
                  <Button size="sm" onClick={() => setRecording(r)}>
                    {t(owes ? "update.balance" : "update.value")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {!busy && (
          <div className="add">
            {creating ? (
              <AccountCreator
                domain={domain}
                accounts={accounts}
                defaultCurrency={userDoc?.mainCurrency ?? currency}
                createAccount={createAccount}
                framed={false}
                onCreated={() => setCreating(false)}
                onCancel={() => setCreating(false)}
                onError={setMessage}
              />
            ) : (
              <Chip
                variant="add"
                onClick={() => {
                  setCreating(true);
                  setMessage(null);
                }}
              >
                {tf(`account.add.${domain}`)}
              </Chip>
            )}
          </div>
        )}

        {message && (
          <p className="message" role="alert">
            {message}
          </p>
        )}
      </Card>

      {open && (
        <InvestmentValuePanel
          key={open.key}
          domain={domain}
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

      {paying && (
        <DebtPaymentModal
          mode={paying.mode}
          debt={paying.debt}
          categories={categories}
          ctx={ctx}
          onClose={() => setPaying(null)}
        />
      )}

      {recording && (
        <ValuationModal
          open
          domain={domain}
          selector={recording.selector}
          name={recording.name}
          costBasis={recording.invested}
          latestValue={recording.latest ? recording.value : undefined}
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

        .add {
          margin-top: 12px;
        }

        .message {
          margin: 10px 0 0;
          font-size: 0.85rem;
          color: var(--accent-hot);
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

        .original {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.72rem;
          color: var(--fg-2);
        }

        .gain {
          font-size: 0.72rem;
        }

        .up {
          color: var(--positive);
        }

        .down {
          color: var(--negative);
        }
      `}</style>
    </>
  );
}

interface DebtActionsProps {
  debt: DebtSummaryRow;
  onPay: (mode: DebtPaymentMode, debt: DebtSummaryRow) => void;
  onUpdate: () => void;
}

/**
 * A debt row's quick actions: the one it needs most as a button (pay what
 * is owed, or record a balance when there is none), the rest in the menu.
 * On a phone the button gives way to the name; the menu still has it.
 */
function DebtActions({ debt, onPay, onUpdate }: DebtActionsProps) {
  const t = useT(DEBT_MESSAGES);
  const owes = debt.row.known && !debt.paidOff;
  const actions = [
    ...(owes
      ? [
          { label: t("owed.pay"), onSelect: () => onPay("part", debt) },
          { label: t("owed.payAll"), onSelect: () => onPay("all", debt) },
        ]
      : []),
    { label: t("owed.borrow"), onSelect: () => onPay("borrow", debt) },
    { label: t("owed.update"), onSelect: onUpdate },
  ];
  return (
    <span className="actions">
      <span className="quick">
        {owes ? (
          <Button size="sm" onClick={() => onPay("part", debt)}>
            {t("owed.pay")}
          </Button>
        ) : !debt.row.known ? (
          <Button size="sm" onClick={onUpdate}>
            {t("owed.update")}
          </Button>
        ) : null}
      </span>
      <KebabMenu aria-label={t("owed.actionsFor", { name: debt.row.name })} actions={actions} />
      <style jsx>{`
        .actions {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        @media (max-width: 479px) {
          .quick {
            display: none;
          }
        }
      `}</style>
    </span>
  );
}
