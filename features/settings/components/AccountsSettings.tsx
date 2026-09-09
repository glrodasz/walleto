import { useState } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { TextField } from "../../../components/atoms/TextField";
import { Select } from "../../../components/atoms/Select";
import { Button } from "../../../components/atoms/Button";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { useAccounts } from "../../../hooks/useAccounts";
import { ACCOUNT_NOUN, accountLabel, formatInterestRate } from "../../../helpers/accounts";
import { DOMAIN_CONFIG } from "../../domains/helpers/domainConfig";
import { SELECTABLE_CURRENCIES, CURRENCY_SYMBOL } from "../../../constants";
import type { Account, AccountDomain, Currency, InterestPeriod } from "../../../types";

const DOMAINS: AccountDomain[] = ["INVESTMENT", "SAVING"];

const CURRENCY_OPTIONS = SELECTABLE_CURRENCIES.map((c) => ({
  value: c.value,
  label: `${CURRENCY_SYMBOL[c.value]} ${c.label}`,
}));

const PERIOD_OPTIONS: { value: InterestPeriod; label: string }[] = [
  { value: "YEARLY", label: "Yearly" },
  { value: "MONTHLY", label: "Monthly" },
];

interface Draft {
  name: string;
  provider: string;
  currency: Currency;
  rate: string;
  period: InterestPeriod;
}

const draftOf = (a: Account): Draft => ({
  name: a.name,
  provider: a.provider ?? "",
  currency: a.currency,
  rate: a.interestRate ? String(a.interestRate.value) : "",
  period: a.interestRate?.period ?? "YEARLY",
});

/**
 * Investment accounts and savings pockets: rename, change the bank or
 * broker, the currency and the interest rate, or archive. New ones are
 * created from the entry forms, where they are needed.
 */
export function AccountsSettings() {
  const [domain, setDomain] = useState<AccountDomain>("INVESTMENT");
  const { accounts, loading, error, update, remove } = useAccounts(domain);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const noun = ACCOUNT_NOUN[domain].singular;

  const run = async (id: string, action: () => Promise<void>, failure: string) => {
    setBusyId(id);
    setMessage(null);
    try {
      await action();
    } catch (err) {
      console.error(failure, err);
      setMessage(failure);
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (a: Account) => {
    setEditingId(a.id!);
    setDraft(draftOf(a));
    setMessage(null);
  };

  const save = async () => {
    const id = editingId;
    const d = draft;
    if (!id || !d) return;
    const name = d.name.trim();
    if (!name) return setMessage(`Give the ${noun} a name`);
    const rate = d.rate.trim() === "" ? null : Number(d.rate);
    if (rate !== null && !(rate >= 0 && rate <= 100)) {
      return setMessage("Interest rate must be between 0 and 100");
    }
    setEditingId(null);
    await run(
      id,
      () =>
        update(id, {
          name,
          provider: d.provider.trim() || null,
          currency: d.currency,
          interestRate: rate === null ? null : { value: rate, period: d.period },
        }),
      `Couldn't update the ${noun}`
    );
  };

  return (
    <Card>
      <SectionTitle title="Accounts & pockets" />
      <div className="tabs" role="tablist" aria-label="Domain">
        {DOMAINS.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={domain === d}
            className={`tab${domain === d ? " is-active" : ""}`}
            style={{ "--tab-accent": DOMAIN_CONFIG[d].accent } as React.CSSProperties}
            onClick={() => {
              setDomain(d);
              setEditingId(null);
              setMessage(null);
            }}
          >
            {DOMAIN_CONFIG[d].title}
          </button>
        ))}
      </div>

      {error && <ErrorState error={error} />}

      {loading ? (
        <p className="hint">Loading…</p>
      ) : (
        <ul className="list">
          {accounts.map((a) => (
            <li key={a.id} className="row">
              {editingId === a.id && draft ? (
                <form
                  className="edit"
                  onSubmit={(e) => {
                    e.preventDefault();
                    save();
                  }}
                >
                  <div className="pair">
                    <TextField
                      label="Name"
                      autoFocus
                      value={draft.name}
                      onValueChange={(v) => setDraft({ ...draft, name: v })}
                    />
                    <TextField
                      label="Bank or broker"
                      placeholder="Optional"
                      value={draft.provider}
                      onValueChange={(v) => setDraft({ ...draft, provider: v })}
                    />
                  </div>
                  <div className="pair">
                    <Select
                      label="Currency"
                      options={CURRENCY_OPTIONS}
                      value={draft.currency}
                      onValueChange={(v) => setDraft({ ...draft, currency: v as Currency })}
                    />
                    <div className="pair">
                      <TextField
                        label="Interest rate %"
                        placeholder="None"
                        inputMode="decimal"
                        align="right"
                        value={draft.rate}
                        onValueChange={(v) =>
                          setDraft({ ...draft, rate: v.replace(/[^\d.]/g, "") })
                        }
                      />
                      <Select
                        label="Period"
                        options={PERIOD_OPTIONS}
                        value={draft.period}
                        onValueChange={(v) => setDraft({ ...draft, period: v as InterestPeriod })}
                      />
                    </div>
                  </div>
                  <div className="actions">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm">
                      Save
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <span className="main">
                    <span className="name">{accountLabel(a)}</span>
                    <span className="meta">
                      {a.currency}
                      {a.interestRate ? ` · ${formatInterestRate(a.interestRate)}` : ""}
                    </span>
                  </span>
                  <KebabMenu
                    aria-label={`Actions for ${a.name}`}
                    actions={[
                      { label: "Edit", onSelect: () => startEdit(a) },
                      {
                        label: busyId === a.id ? "Archiving…" : "Archive",
                        onSelect: () =>
                          a.id && run(a.id, () => remove(a.id!), `Couldn't archive the ${noun}`),
                        danger: true,
                        disabled: busyId === a.id,
                      },
                    ]}
                  />
                </>
              )}
            </li>
          ))}
          {accounts.length === 0 && (
            <li className="hint">
              No {noun}s yet — add one from a {domain === "SAVING" ? "deposit" : "contribution"}{" "}
              form
            </li>
          )}
        </ul>
      )}

      {message && (
        <p className="message" role="alert">
          {message}
        </p>
      )}

      <style jsx>{`
        .tabs {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 4px;
          margin-bottom: 12px;
        }

        .tab {
          min-height: 36px;
          border: 1px solid var(--line);
          border-radius: var(--r-sm);
          background: var(--bg-2);
          color: var(--fg-2);
          font-family: inherit;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
        }

        .tab.is-active {
          border-color: var(--tab-accent);
          color: var(--tab-accent);
          background: color-mix(in srgb, var(--tab-accent) 12%, transparent);
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
          gap: 8px;
          min-height: 44px;
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
          gap: 2px;
          padding: 8px 0;
        }

        .name {
          font-size: 0.9rem;
          color: var(--fg-0);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .meta {
          font-size: 0.72rem;
          color: var(--fg-2);
        }

        .edit {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 8px 0;
        }

        .pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .hint {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .message {
          margin: 10px 0 0;
          font-size: 0.85rem;
          color: var(--accent-hot);
        }

        @media (max-width: 480px) {
          .pair {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Card>
  );
}
